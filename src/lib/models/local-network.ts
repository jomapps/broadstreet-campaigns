import mongoose, { Document, Schema } from 'mongoose';

export interface ILocalNetwork extends Document {
  // Core Broadstreet API fields
  name: string;
  id: number;
  group_id?: number;
  web_home_url?: string;
  logo?: {
    url: string;
  };
  valet_active?: boolean;
  path?: string;
  advertiser_count?: number;
  zone_count?: number;
  notes?: string;
  
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

const LocalNetworkSchema = new Schema<ILocalNetwork>({
  // Core Broadstreet API fields
  name: {
    type: String,
    required: true,
    trim: true,
  },
  id: {
    type: Number,
    required: true,
  },
  group_id: {
    type: Number,
  },
  web_home_url: {
    type: String,
    trim: true,
  },
  logo: {
    url: String,
  },
  valet_active: {
    type: Boolean,
    default: false,
  },
  path: {
    type: String,
    trim: true,
  },
  advertiser_count: {
    type: Number,
    default: 0,
  },
  zone_count: {
    type: Number,
    default: 0,
  },
  notes: {
    type: String,
    trim: true,
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
LocalNetworkSchema.index({ id: 1 }, { unique: true });
LocalNetworkSchema.index({ name: 1 }, { unique: true });
LocalNetworkSchema.index({ created_locally: 1 });
LocalNetworkSchema.index({ synced_with_api: 1 });

export default mongoose.models.LocalNetwork || mongoose.model<ILocalNetwork>('LocalNetwork', LocalNetworkSchema);
