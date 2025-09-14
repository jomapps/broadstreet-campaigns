import mongoose, { Schema, Document } from 'mongoose';
import { mapApiIds } from '@/lib/types/mapApiIds';

export interface INetwork extends Document {
  broadstreet_id: number;
  mongo_id: string;
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
  broadstreet_id: {
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
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  id: false,
});

// Note: broadstreet_id field already has unique: true which creates an index

// Virtual getters for IDs
NetworkSchema.virtual('mongo_id').get(function (this: any) {
  return this._id?.toString();
});

// Ensure virtuals are present in lean() results
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const leanVirtuals = require('mongoose-lean-virtuals');
  NetworkSchema.plugin(leanVirtuals);
} catch (_) {
  // optional in dev without plugin installed
}

// Temporary static to safely map API payloads
NetworkSchema.statics.fromApi = function fromApi(payload: any) {
  const mapped = mapApiIds(payload, { stripId: false });
  return mapped;
};

export default mongoose.models.Network || mongoose.model<INetwork>('Network', NetworkSchema);
