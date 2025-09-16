import { EventEmitter } from 'events';

export interface ProgressUpdate {
  syncLogId: string;
  networkId: number;
  phase: string;
  progressPercentage: number;
  currentEntity?: string;
  totalEntities: number;
  processedEntities: number;
  successfulEntities: number;
  failedEntities: number;
  estimatedTimeRemaining?: number;
  message?: string;
  timestamp: Date;
}

export interface PhaseWeights {
  validation: number;
  advertisers: number;
  zones: number;
  campaigns: number;
  placements: number;
  cleanup: number;
}

export class ProgressService extends EventEmitter {
  private activeSync: Map<string, ProgressUpdate> = new Map();
  private phaseWeights: PhaseWeights = {
    validation: 5,
    advertisers: 25,
    zones: 25,
    campaigns: 30,
    placements: 10,
    cleanup: 5
  };

  /**
   * Start tracking progress for a sync operation
   */
  startSync(syncLogId: string, networkId: number, totalEntities: number): void {
    const progress: ProgressUpdate = {
      syncLogId,
      networkId,
      phase: 'validation',
      progressPercentage: 0,
      totalEntities,
      processedEntities: 0,
      successfulEntities: 0,
      failedEntities: 0,
      message: 'Starting sync validation...',
      timestamp: new Date()
    };

    this.activeSync.set(syncLogId, progress);
    this.emit('progress', progress);
  }

  /**
   * Update progress for a specific phase
   */
  updatePhaseProgress(
    syncLogId: string,
    phase: keyof PhaseWeights,
    processedInPhase: number,
    totalInPhase: number,
    currentEntity?: string,
    message?: string
  ): void {
    const progress = this.activeSync.get(syncLogId);
    if (!progress) return;

    // Calculate weighted progress across all phases
    const phaseProgress = totalInPhase > 0 ? (processedInPhase / totalInPhase) * 100 : 100;
    const weightedProgress = this.calculateWeightedProgress(phase, phaseProgress);

    progress.phase = phase;
    progress.progressPercentage = Math.min(100, Math.max(0, weightedProgress));
    progress.currentEntity = currentEntity;
    progress.message = message || `Processing ${phase}... (${processedInPhase}/${totalInPhase})`;
    progress.timestamp = new Date();

    // Estimate time remaining based on current progress and elapsed time
    if (progress.progressPercentage > 0) {
      const startTime = new Date(progress.timestamp.getTime() - (progress.progressPercentage * 1000)); // Rough estimate
      const elapsedTime = progress.timestamp.getTime() - startTime.getTime();
      const totalEstimatedTime = (elapsedTime / progress.progressPercentage) * 100;
      progress.estimatedTimeRemaining = Math.max(0, totalEstimatedTime - elapsedTime);
    }

    this.activeSync.set(syncLogId, progress);
    this.emit('progress', progress);
  }

  /**
   * Update entity counts for current sync
   */
  updateEntityCounts(
    syncLogId: string,
    processedEntities: number,
    successfulEntities: number,
    failedEntities: number
  ): void {
    const progress = this.activeSync.get(syncLogId);
    if (!progress) return;

    progress.processedEntities = processedEntities;
    progress.successfulEntities = successfulEntities;
    progress.failedEntities = failedEntities;
    progress.timestamp = new Date();

    this.activeSync.set(syncLogId, progress);
    this.emit('progress', progress);
  }

  /**
   * Complete sync operation
   */
  completeSync(syncLogId: string, success: boolean, message?: string): void {
    const progress = this.activeSync.get(syncLogId);
    if (!progress) return;

    progress.progressPercentage = 100;
    progress.phase = 'cleanup';
    progress.message = message || (success ? 'Sync completed successfully!' : 'Sync completed with errors');
    progress.estimatedTimeRemaining = 0;
    progress.timestamp = new Date();

    this.emit('progress', progress);
    this.emit('complete', { syncLogId, success, progress });

    // Clean up after a delay
    setTimeout(() => {
      this.activeSync.delete(syncLogId);
    }, 30000); // Keep for 30 seconds after completion
  }

  /**
   * Get current progress for a sync operation
   */
  getProgress(syncLogId: string): ProgressUpdate | undefined {
    return this.activeSync.get(syncLogId);
  }

  /**
   * Get all active sync operations
   */
  getAllActiveSync(): ProgressUpdate[] {
    return Array.from(this.activeSync.values());
  }

  /**
   * Calculate weighted progress based on phase completion
   */
  private calculateWeightedProgress(currentPhase: keyof PhaseWeights, phaseProgress: number): number {
    const phases: (keyof PhaseWeights)[] = ['validation', 'advertisers', 'zones', 'campaigns', 'placements', 'cleanup'];
    const currentPhaseIndex = phases.indexOf(currentPhase);
    
    let totalProgress = 0;
    
    // Add weight for completed phases
    for (let i = 0; i < currentPhaseIndex; i++) {
      totalProgress += this.phaseWeights[phases[i]];
    }
    
    // Add partial weight for current phase
    totalProgress += (this.phaseWeights[currentPhase] * phaseProgress) / 100;
    
    return totalProgress;
  }

  /**
   * Set custom phase weights
   */
  setPhaseWeights(weights: Partial<PhaseWeights>): void {
    this.phaseWeights = { ...this.phaseWeights, ...weights };
  }

  /**
   * Cancel sync operation
   */
  cancelSync(syncLogId: string, reason?: string): void {
    const progress = this.activeSync.get(syncLogId);
    if (!progress) return;

    progress.message = reason || 'Sync operation cancelled';
    progress.timestamp = new Date();

    this.emit('cancelled', { syncLogId, reason, progress });
    this.activeSync.delete(syncLogId);
  }
}

// Singleton instance
export const progressService = new ProgressService();

// Server-Sent Events helper for Next.js API routes
export function createSSEResponse(req: any, res: any, syncLogId?: string) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  const sendEvent = (data: any, event?: string) => {
    res.write(`event: ${event || 'progress'}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Send initial state
  if (syncLogId) {
    const progress = progressService.getProgress(syncLogId);
    if (progress) {
      sendEvent(progress, 'progress');
    }
  } else {
    // Send all active syncs
    const allProgress = progressService.getAllActiveSync();
    sendEvent(allProgress, 'all-progress');
  }

  // Listen for progress updates
  const progressHandler = (progress: ProgressUpdate) => {
    if (!syncLogId || progress.syncLogId === syncLogId) {
      sendEvent(progress, 'progress');
    }
  };

  const completeHandler = (data: { syncLogId: string; success: boolean; progress: ProgressUpdate }) => {
    if (!syncLogId || data.syncLogId === syncLogId) {
      sendEvent(data, 'complete');
    }
  };

  const cancelledHandler = (data: { syncLogId: string; reason?: string; progress: ProgressUpdate }) => {
    if (!syncLogId || data.syncLogId === syncLogId) {
      sendEvent(data, 'cancelled');
    }
  };

  progressService.on('progress', progressHandler);
  progressService.on('complete', completeHandler);
  progressService.on('cancelled', cancelledHandler);

  // Clean up on client disconnect
  req.on('close', () => {
    progressService.off('progress', progressHandler);
    progressService.off('complete', completeHandler);
    progressService.off('cancelled', cancelledHandler);
    res.end();
  });

  // Keep connection alive
  const keepAlive = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 30000);

  req.on('close', () => {
    clearInterval(keepAlive);
  });
}
