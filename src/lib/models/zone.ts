import mongoose, { Schema, Document } from 'mongoose';

export interface IZone extends Document {
  id: number;
  name: string;
  network_id: number;
  alias?: string | null;
  self_serve: boolean;
  // Parsed zone information
  size_type?: 'SQ' | 'PT' | 'LS' | null;
  size_number?: number | null;
  category?: string | null;
  block?: string | null;
  is_home?: boolean;
  // Creation and sync tracking
  created_locally?: boolean;
  synced_with_api?: boolean;
  created_at?: Date;
  synced_at?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ZoneSchema = new Schema<IZone>({
  id: {
    type: Number,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  network_id: {
    type: Number,
    required: true,
  },
  alias: {
    type: String,
    default: null,
  },
  self_serve: {
    type: Boolean,
    default: false,
  },
  // Parsed zone information for easier querying
  size_type: {
    type: String,
    enum: ['SQ', 'PT', 'LS', null],
    default: null,
  },
  size_number: {
    type: Number,
    default: null,
  },
  category: {
    type: String,
    default: null,
  },
  block: {
    type: String,
    default: null,
  },
  is_home: {
    type: Boolean,
    default: false,
  },
  // Creation and sync tracking
  created_locally: {
    type: Boolean,
    default: false,
  },
  synced_with_api: {
    type: Boolean,
    default: true, // Assume existing data is synced
  },
  created_at: {
    type: Date,
  },
  synced_at: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Create indexes for faster queries
// Note: id field already has unique: true which creates an index
ZoneSchema.index({ network_id: 1 });
ZoneSchema.index({ size_type: 1 });
ZoneSchema.index({ category: 1 });

export default mongoose.models.Zone || mongoose.model<IZone>('Zone', ZoneSchema);
