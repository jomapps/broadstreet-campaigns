import mongoose, { Document, Schema } from 'mongoose';

export interface ILocalZone extends Document {
  // Core Broadstreet API fields
  name: string;
  network_id: number;
  alias?: string;
  self_serve?: boolean;
  
  // Additional Broadstreet dashboard fields
  advertisement_count?: number;
  allow_duplicate_ads?: boolean;
  concurrent_campaigns?: number;
  advertisement_label?: string;
  archived?: boolean;
  display_type?: 'standard' | 'rotation';
  rotation_interval?: number;
  animation_type?: string;
  width?: number;
  height?: number;
  rss_shuffle?: boolean;
  style?: string;
  
  // Local creation tracking
  created_locally: boolean;
  synced_with_api: boolean;
  created_at: Date;
  synced_at?: Date;
  original_broadstreet_id?: number;
  sync_errors: string[];
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const LocalZoneSchema = new Schema<ILocalZone>({
  // Core Broadstreet API fields
  name: {
    type: String,
    required: true,
    trim: true,
  },
  network_id: {
    type: Number,
    required: true,
  },
  alias: {
    type: String,
    trim: true,
  },
  self_serve: {
    type: Boolean,
  },
  
  // Additional Broadstreet dashboard fields (all optional)
  advertisement_count: {
    type: Number,
    min: 1,
  },
  allow_duplicate_ads: {
    type: Boolean,
  },
  concurrent_campaigns: {
    type: Number,
    min: 0,
  },
  advertisement_label: {
    type: String,
    trim: true,
  },
  archived: {
    type: Boolean,
  },
  display_type: {
    type: String,
    enum: ['standard', 'rotation'],
  },
  rotation_interval: {
    type: Number,
    min: 1000, // Minimum 1 second
  },
  animation_type: {
    type: String,
  },
  width: {
    type: Number,
    min: 1,
  },
  height: {
    type: Number,
    min: 1,
  },
  rss_shuffle: {
    type: Boolean,
  },
  style: {
    type: String,
  },
  
  // Local creation tracking
  created_locally: {
    type: Boolean,
    default: true,
  },
  synced_with_api: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  synced_at: {
    type: Date,
  },
  original_broadstreet_id: {
    type: Number,
  },
  sync_errors: {
    type: [String],
    default: [],
  },
}, {
  timestamps: true,
});

// Indexes for performance
LocalZoneSchema.index({ network_id: 1, name: 1 }, { unique: true });
LocalZoneSchema.index({ network_id: 1, alias: 1 }, { unique: true, sparse: true });
LocalZoneSchema.index({ created_locally: 1 });
LocalZoneSchema.index({ synced_with_api: 1 });

export default mongoose.models.LocalZone || mongoose.model<ILocalZone>('LocalZone', LocalZoneSchema);
