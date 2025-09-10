import mongoose, { Schema, Document } from 'mongoose';

export interface ISyncLog extends Document {
  entity: string;
  status: 'success' | 'error' | 'pending';
  recordCount: number;
  error?: string;
  startTime: Date;
  endTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SyncLogSchema = new Schema<ISyncLog>({
  entity: {
    type: String,
    required: true,
    enum: ['networks', 'advertisers', 'advertisements', 'zones', 'campaigns', 'placements'],
  },
  status: {
    type: String,
    required: true,
    enum: ['success', 'error', 'pending'],
    default: 'pending',
  },
  recordCount: {
    type: Number,
    default: 0,
  },
  error: {
    type: String,
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now,
  },
  endTime: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Create indexes for faster queries
SyncLogSchema.index({ entity: 1 });
SyncLogSchema.index({ status: 1 });
SyncLogSchema.index({ createdAt: -1 });

export default mongoose.models.SyncLog || mongoose.model<ISyncLog>('SyncLog', SyncLogSchema);
