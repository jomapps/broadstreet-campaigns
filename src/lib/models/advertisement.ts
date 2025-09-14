import mongoose, { Schema, Document } from 'mongoose';
import { mapApiIds } from '@/lib/types/mapApiIds';

export interface IAdvertisement extends Document {
  broadstreet_id: number;
  mongo_id: string;
  name: string;
  updated_at: string;
  type: string;
  advertiser: string;
  active: {
    url?: string | null;
  };
  active_placement: boolean;
  preview_url: string;
  notes?: string;
  // Creation and sync tracking
  created_locally?: boolean;
  synced_with_api?: boolean;
  created_at?: Date;
  synced_at?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdvertisementSchema = new Schema<IAdvertisement>({
  broadstreet_id: {
    type: Number,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  updated_at: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  advertiser: {
    type: String,
    required: true,
  },
  active: {
    url: {
      type: String,
      default: null,
    },
  },
  active_placement: {
    type: Boolean,
    required: true,
  },
  preview_url: {
    type: String,
    required: true,
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

// Create indexes for faster queries
// Note: broadstreet_id field already has unique: true which creates an index
AdvertisementSchema.index({ advertiser: 1 });
AdvertisementSchema.index({ type: 1 });
AdvertisementSchema.index({ active_placement: 1 });

// Virtual getters for IDs
AdvertisementSchema.virtual('mongo_id').get(function (this: any) {
  return this._id?.toString();
});

// Ensure virtuals are present in lean() results
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const leanVirtuals = require('mongoose-lean-virtuals');
  AdvertisementSchema.plugin(leanVirtuals);
} catch (_) {
  // optional in dev without plugin installed
}

// Temporary static to safely map API payloads
AdvertisementSchema.statics.fromApi = function fromApi(payload: any) {
  const mapped = mapApiIds(payload, { stripId: false });
  return mapped;
};

export default mongoose.models.Advertisement || mongoose.model<IAdvertisement>('Advertisement', AdvertisementSchema);
