import SyncLog, { ISyncLog, ISyncPhase, ISyncOperation } from './models/sync-log';
import connectDB from './mongodb';

export class AuditService {
  /**
   * Create a new sync log entry
   */
  async createSyncLog(networkId: number, syncType: 'full' | 'incremental' | 'retry' = 'full'): Promise<ISyncLog> {
    await connectDB();
    
    const syncLog = new SyncLog({
      networkId,
      syncType,
      status: 'pending',
      startTime: new Date(),
      phases: [],
      totalEntities: 0,
      processedEntities: 0,
      successfulEntities: 0,
      failedEntities: 0,
      skippedEntities: 0,
      progressPercentage: 0,
      criticalErrors: []
    });
    
    return await syncLog.save();
  }

  /**
   * Start a sync phase
   */
  async startPhase(
    syncLogId: string, 
    phase: ISyncPhase['phase'], 
    totalEntities: number
  ): Promise<void> {
    await connectDB();
    
    const syncLog = await SyncLog.findById(syncLogId);
    if (!syncLog) throw new Error('Sync log not found');
    
    // Update current phase
    syncLog.currentPhase = phase;
    
    // Add or update phase
    const existingPhaseIndex = syncLog.phases.findIndex(p => p.phase === phase);
    const phaseData: ISyncPhase = {
      phase,
      status: 'running',
      startTime: new Date(),
      totalEntities,
      processedEntities: 0,
      successfulEntities: 0,
      failedEntities: 0,
      skippedEntities: 0,
      operations: []
    };
    
    if (existingPhaseIndex >= 0) {
      syncLog.phases[existingPhaseIndex] = phaseData;
    } else {
      syncLog.phases.push(phaseData);
    }
    
    await syncLog.save();
  }

  /**
   * Log a sync operation
   */
  async logOperation(
    syncLogId: string,
    phase: ISyncPhase['phase'],
    operation: Omit<ISyncOperation, 'timestamp'>
  ): Promise<void> {
    await connectDB();
    
    const syncLog = await SyncLog.findById(syncLogId);
    if (!syncLog) throw new Error('Sync log not found');
    
    const phaseIndex = syncLog.phases.findIndex(p => p.phase === phase);
    if (phaseIndex === -1) throw new Error(`Phase ${phase} not found`);
    
    // Add operation to phase
    const operationWithTimestamp: ISyncOperation = {
      ...operation,
      timestamp: new Date()
    };
    
    syncLog.phases[phaseIndex].operations.push(operationWithTimestamp);
    
    // Update phase statistics
    const phaseData = syncLog.phases[phaseIndex];
    phaseData.processedEntities++;
    
    switch (operation.status) {
      case 'success':
        phaseData.successfulEntities++;
        syncLog.successfulEntities++;
        break;
      case 'error':
        phaseData.failedEntities++;
        syncLog.failedEntities++;
        if (operation.errorCode === 'AUTH' || operation.errorCode === 'NETWORK') {
          syncLog.criticalErrors.push(`${operation.entityType} ${operation.entityName}: ${operation.errorMessage}`);
        }
        break;
      case 'skipped':
        phaseData.skippedEntities++;
        syncLog.skippedEntities++;
        break;
    }
    
    syncLog.processedEntities++;
    
    await syncLog.save();
  }

  /**
   * Complete a sync phase
   */
  async completePhase(
    syncLogId: string, 
    phase: ISyncPhase['phase'], 
    status: 'success' | 'error' = 'success',
    errorSummary?: string
  ): Promise<void> {
    await connectDB();
    
    const syncLog = await SyncLog.findById(syncLogId);
    if (!syncLog) throw new Error('Sync log not found');
    
    const phaseIndex = syncLog.phases.findIndex(p => p.phase === phase);
    if (phaseIndex === -1) throw new Error(`Phase ${phase} not found`);
    
    const phaseData = syncLog.phases[phaseIndex];
    phaseData.status = status;
    phaseData.endTime = new Date();
    phaseData.duration = phaseData.endTime.getTime() - phaseData.startTime.getTime();
    
    if (errorSummary) {
      phaseData.errorSummary = errorSummary;
    }
    
    await syncLog.save();
  }

  /**
   * Complete the entire sync process
   */
  async completeSyncLog(
    syncLogId: string, 
    status: 'success' | 'error' | 'cancelled' = 'success',
    errorSummary?: string
  ): Promise<void> {
    await connectDB();
    
    const syncLog = await SyncLog.findById(syncLogId);
    if (!syncLog) throw new Error('Sync log not found');
    
    syncLog.status = status;
    syncLog.endTime = new Date();
    syncLog.duration = syncLog.endTime.getTime() - syncLog.startTime.getTime();
    syncLog.progressPercentage = 100;
    syncLog.currentPhase = undefined;
    
    if (errorSummary) {
      syncLog.errorSummary = errorSummary;
    }
    
    await syncLog.save();
  }

  /**
   * Update sync progress
   */
  async updateProgress(
    syncLogId: string, 
    progressPercentage: number, 
    estimatedTimeRemaining?: number
  ): Promise<void> {
    await connectDB();
    
    const syncLog = await SyncLog.findById(syncLogId);
    if (!syncLog) throw new Error('Sync log not found');
    
    syncLog.progressPercentage = Math.min(100, Math.max(0, progressPercentage));
    if (estimatedTimeRemaining !== undefined) {
      syncLog.estimatedTimeRemaining = estimatedTimeRemaining;
    }
    
    await syncLog.save();
  }

  /**
   * Get sync logs with filtering and pagination
   */
  async getSyncLogs(options: {
    networkId?: number;
    status?: string;
    syncType?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{ logs: ISyncLog[]; total: number }> {
    await connectDB();
    
    const {
      networkId,
      status,
      syncType,
      limit = 50,
      offset = 0,
      sortBy = 'startTime',
      sortOrder = 'desc'
    } = options;
    
    const filter: any = {};
    if (networkId) filter.networkId = networkId;
    if (status) filter.status = status;
    if (syncType) filter.syncType = syncType;
    
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const [logs, total] = await Promise.all([
      SyncLog.find(filter)
        .sort(sort)
        .limit(limit)
        .skip(offset)
        .lean(),
      SyncLog.countDocuments(filter)
    ]);
    
    return { logs: logs as ISyncLog[], total };
  }

  /**
   * Get detailed sync log by ID
   */
  async getSyncLogById(syncLogId: string): Promise<ISyncLog | null> {
    await connectDB();
    return await SyncLog.findById(syncLogId).lean() as ISyncLog | null;
  }

  /**
   * Get sync statistics for a network
   */
  async getSyncStatistics(networkId: number, days: number = 30): Promise<{
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    averageDuration: number;
    totalEntitiesSynced: number;
    errorBreakdown: { [key: string]: number };
  }> {
    await connectDB();
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const logs = await SyncLog.find({
      networkId,
      startTime: { $gte: startDate }
    }).lean();
    
    const stats = {
      totalSyncs: logs.length,
      successfulSyncs: logs.filter(l => l.status === 'success').length,
      failedSyncs: logs.filter(l => l.status === 'error').length,
      averageDuration: 0,
      totalEntitiesSynced: 0,
      errorBreakdown: {} as { [key: string]: number }
    };
    
    if (logs.length > 0) {
      const completedLogs = logs.filter(l => l.duration);
      stats.averageDuration = completedLogs.reduce((sum, l) => sum + (l.duration || 0), 0) / completedLogs.length;
      stats.totalEntitiesSynced = logs.reduce((sum, l) => sum + l.successfulEntities, 0);
      
      // Error breakdown
      logs.forEach(log => {
        log.phases.forEach(phase => {
          phase.operations.forEach(op => {
            if (op.status === 'error' && op.errorCode) {
              stats.errorBreakdown[op.errorCode] = (stats.errorBreakdown[op.errorCode] || 0) + 1;
            }
          });
        });
      });
    }
    
    return stats;
  }
}

export const auditService = new AuditService();
