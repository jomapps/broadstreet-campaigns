import mongoose, { Schema, Document } from 'mongoose';

export interface ISyncOperation {
  entityType: 'advertiser' | 'zone' | 'campaign' | 'placement';
  entityId: string; // MongoDB ObjectId or Broadstreet ID
  entityName: string;
  operation: 'create' | 'update' | 'link' | 'skip';
  status: 'success' | 'error' | 'retry' | 'skipped';
  errorCode?: 'DUPLICATE' | 'DEPENDENCY' | 'NETWORK' | 'VALIDATION' | 'AUTH' | 'LINKED_DUPLICATE';
  errorMessage?: string;
  retryCount?: number;
  broadstreetId?: number;
  duration?: number; // milliseconds
  timestamp: Date;
}

export interface ISyncPhase {
  phase: 'validation' | 'advertisers' | 'zones' | 'campaigns' | 'placements' | 'cleanup';
  status: 'pending' | 'running' | 'success' | 'error' | 'skipped';
  startTime: Date;
  endTime?: Date;
  duration?: number; // milliseconds
  totalEntities: number;
  processedEntities: number;
  successfulEntities: number;
  failedEntities: number;
  skippedEntities: number;
  operations: ISyncOperation[];
  errorSummary?: string;
}

export interface ISyncLog extends Document {
  networkId: number;
  syncType: 'full' | 'incremental' | 'retry';
  status: 'pending' | 'running' | 'success' | 'error' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  duration?: number; // milliseconds

  // Phase tracking
  phases: ISyncPhase[];
  currentPhase?: string;

  // Overall statistics
  totalEntities: number;
  processedEntities: number;
  successfulEntities: number;
  failedEntities: number;
  skippedEntities: number;

  // Progress tracking
  progressPercentage: number;
  estimatedTimeRemaining?: number; // milliseconds

  // Error tracking
  errorSummary?: string;
  criticalErrors: string[];

  // Legacy fields for backward compatibility
  entity?: string;
  recordCount?: number;
  error?: string;

  createdAt: Date;
  updatedAt: Date;
}

const SyncOperationSchema = new Schema<ISyncOperation>({
  entityType: {
    type: String,
    required: true,
    enum: ['advertiser', 'zone', 'campaign', 'placement']
  },
  entityId: {
    type: String,
    required: true
  },
  entityName: {
    type: String,
    required: true
  },
  operation: {
    type: String,
    required: true,
    enum: ['create', 'update', 'link', 'skip']
  },
  status: {
    type: String,
    required: true,
    enum: ['success', 'error', 'retry', 'skipped']
  },
  errorCode: {
    type: String,
    enum: ['DUPLICATE', 'DEPENDENCY', 'NETWORK', 'VALIDATION', 'AUTH', 'LINKED_DUPLICATE']
  },
  errorMessage: String,
  retryCount: {
    type: Number,
    default: 0
  },
  broadstreetId: Number,
  duration: Number,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const SyncPhaseSchema = new Schema<ISyncPhase>({
  phase: {
    type: String,
    required: true,
    enum: ['validation', 'advertisers', 'zones', 'campaigns', 'placements', 'cleanup']
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'running', 'success', 'error', 'skipped'],
    default: 'pending'
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: Date,
  duration: Number,
  totalEntities: {
    type: Number,
    default: 0
  },
  processedEntities: {
    type: Number,
    default: 0
  },
  successfulEntities: {
    type: Number,
    default: 0
  },
  failedEntities: {
    type: Number,
    default: 0
  },
  skippedEntities: {
    type: Number,
    default: 0
  },
  operations: [SyncOperationSchema],
  errorSummary: String
});

const SyncLogSchema = new Schema<ISyncLog>({
  networkId: {
    type: Number,
    required: true
  },
  syncType: {
    type: String,
    required: true,
    enum: ['full', 'incremental', 'retry'],
    default: 'full'
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'running', 'success', 'error', 'cancelled'],
    default: 'pending'
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: Date,
  duration: Number,

  // Phase tracking
  phases: [SyncPhaseSchema],
  currentPhase: String,

  // Overall statistics
  totalEntities: {
    type: Number,
    default: 0
  },
  processedEntities: {
    type: Number,
    default: 0
  },
  successfulEntities: {
    type: Number,
    default: 0
  },
  failedEntities: {
    type: Number,
    default: 0
  },
  skippedEntities: {
    type: Number,
    default: 0
  },

  // Progress tracking
  progressPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  estimatedTimeRemaining: Number,

  // Error tracking
  errorSummary: String,
  criticalErrors: [String],

  // Legacy fields for backward compatibility
  entity: {
    type: String,
    enum: ['networks', 'advertisers', 'advertisements', 'zones', 'campaigns', 'placements']
  },
  recordCount: {
    type: Number,
    default: 0
  },
  error: String
}, {
  timestamps: true
});

// Create indexes for faster queries
SyncLogSchema.index({ networkId: 1 });
SyncLogSchema.index({ status: 1 });
SyncLogSchema.index({ syncType: 1 });
SyncLogSchema.index({ createdAt: -1 });
SyncLogSchema.index({ startTime: -1 });
SyncLogSchema.index({ 'phases.phase': 1 });
SyncLogSchema.index({ 'phases.status': 1 });

// Legacy indexes for backward compatibility
SyncLogSchema.index({ entity: 1 });

export default mongoose.models.SyncLog || mongoose.model<ISyncLog>('SyncLog', SyncLogSchema);
