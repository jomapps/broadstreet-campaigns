import mongoose, { Schema, Document } from 'mongoose';
import { mapApiIds } from '@/lib/types/mapApiIds';

export interface IZone extends Document {
  broadstreet_id: number;
  mongo_id: string;
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
  broadstreet_id: {
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
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  id: false,
});

// Create indexes for faster queries
// Note: broadstreet_id field already has unique: true which creates an index
ZoneSchema.index({ network_id: 1 });
ZoneSchema.index({ size_type: 1 });
ZoneSchema.index({ category: 1 });

// Virtual getters for IDs
ZoneSchema.virtual('mongo_id').get(function (this: any) {
  return this._id?.toString();
});

// New explicit ID naming per entity
ZoneSchema.virtual('local_zone_id').get(function (this: any) {
  return this._id?.toString();
});
ZoneSchema.virtual('broadstreet_zone_id').get(function (this: any) {
  return this.broadstreet_id;
});

// Relationship aliasing to explicit naming
ZoneSchema.virtual('broadstreet_network_id').get(function (this: any) {
  return this.network_id;
});

// Ensure virtuals are present in lean() results
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const leanVirtuals = require('mongoose-lean-virtuals');
  ZoneSchema.plugin(leanVirtuals);
} catch (_) {
  // optional in dev without plugin installed
}

// Temporary static to safely map API payloads
ZoneSchema.statics.fromApi = function fromApi(payload: any) {
  const mapped = mapApiIds(payload, { stripId: false });
  return mapped;
};

export default mongoose.models.Zone || mongoose.model<IZone>('Zone', ZoneSchema);
