import mongoose, { Schema, Document } from 'mongoose';

export interface INetwork extends Document {
  id: number;
  name: string;
  group_id?: number | null;
  web_home_url?: string;
  logo?: {
    url: string;
  };
  valet_active: boolean;
  path: string;
  advertiser_count?: number;
  zone_count?: number;
  notes?: string;
  // Creation and sync tracking
  created_locally?: boolean;
  synced_with_api?: boolean;
  created_at?: Date;
  synced_at?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NetworkSchema = new Schema<INetwork>({
  id: {
    type: Number,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  group_id: {
    type: Number,
    default: null,
  },
  web_home_url: {
    type: String,
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
    required: true,
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

// Note: id field already has unique: true which creates an index

export default mongoose.models.Network || mongoose.model<INetwork>('Network', NetworkSchema);
