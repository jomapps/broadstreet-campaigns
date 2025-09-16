import mongoose, { Schema, Document } from 'mongoose';
import leanVirtuals from 'mongoose-lean-virtuals';
import { mapApiIds } from '@/lib/types/mapApiIds';

export interface IAdvertiser extends Document {
  broadstreet_id: number;
  mongo_id: string;
  name: string;
  logo?: {
    url: string;
  };
  web_home_url?: string;
  notes?: string | null;
  admins?: Array<{
    name: string;
    email: string;
  }>;
  // Creation and sync tracking
  created_locally?: boolean;
  synced_with_api?: boolean;
  created_at?: Date;
  synced_at?: Date;
  network_id?: number;
  createdAt: Date;
  updatedAt: Date;
}

const AdvertiserSchema = new Schema<IAdvertiser>({
  broadstreet_id: {
    type: Number,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  logo: {
    url: String,
  },
  web_home_url: {
    type: String,
  },
  notes: {
    type: String,
    default: null,
  },
  admins: [{
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
  }],
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
  network_id: {
    type: Number,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  id: false,
});

// Virtual getters for standardized three-tier ID system
AdvertiserSchema.virtual('mongo_id').get(function (this: any) {
  return this._id?.toString();
});

// Ensure virtuals are present in lean() results
AdvertiserSchema.plugin(leanVirtuals);

// Temporary static to safely map API payloads
AdvertiserSchema.statics.fromApi = function fromApi(payload: any) {
  const mapped = mapApiIds(payload, { stripId: false });
  return mapped;
};

// Note: broadstreet_id field already has unique: true which creates an index

export default mongoose.models.Advertiser || mongoose.model<IAdvertiser>('Advertiser', AdvertiserSchema);
