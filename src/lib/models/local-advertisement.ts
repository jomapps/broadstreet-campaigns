import mongoose, { Document, Schema } from 'mongoose';

export interface ILocalAdvertisement extends Document {
  mongo_id: string;
  broadstreet_id?: number;
  // Core Broadstreet API fields
  name: string;
  network_id: number;
  type: string;
  advertiser?: string;
  advertiser_id?: number;
  active?: {
    url?: string | null;
  };
  active_placement?: boolean;
  preview_url?: string;
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

const LocalAdvertisementSchema = new Schema<ILocalAdvertisement>({
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
  type: {
    type: String,
    required: true,
    trim: true,
  },
  advertiser: {
    type: String,
    trim: true,
  },
  advertiser_id: {
    type: Number,
  },
  active: {
    url: {
      type: String,
      default: null,
    },
  },
  active_placement: {
    type: Boolean,
    default: true,
  },
  preview_url: {
    type: String,
    trim: true,
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
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  id: false,
});

// Indexes for performance
LocalAdvertisementSchema.index({ network_id: 1, name: 1 }, { unique: true });
LocalAdvertisementSchema.index({ advertiser_id: 1 });
LocalAdvertisementSchema.index({ type: 1 });
LocalAdvertisementSchema.index({ created_locally: 1 });
LocalAdvertisementSchema.index({ synced_with_api: 1 });

// Virtual getters for IDs
LocalAdvertisementSchema.virtual('mongo_id').get(function (this: any) {
  return this._id?.toString();
});
LocalAdvertisementSchema.virtual('broadstreet_id').get(function (this: any) {
  return this.original_broadstreet_id ?? undefined;
});

// Ensure virtuals are present in lean() results
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const leanVirtuals = require('mongoose-lean-virtuals');
  LocalAdvertisementSchema.plugin(leanVirtuals);
} catch (_) {
  // optional in dev without plugin installed
}

export default mongoose.models.LocalAdvertisement || mongoose.model<ILocalAdvertisement>('LocalAdvertisement', LocalAdvertisementSchema);
