import mongoose, { Document, Schema } from 'mongoose';
import leanVirtuals from 'mongoose-lean-virtuals';

export interface ILocalAdvertiser extends Document {
  mongo_id: string;
  broadstreet_id?: number;
  // Core Broadstreet API fields
  name: string;
  network_id: number;
  logo?: {
    url: string;
  };
  web_home_url?: string;
  notes?: string;
  admins?: Array<{
    name: string;
    email: string;
  }>;
  
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

const LocalAdvertiserSchema = new Schema<ILocalAdvertiser>({
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
  logo: {
    url: String,
  },
  web_home_url: {
    type: String,
    trim: true,
  },
  notes: {
    type: String,
    trim: true,
  },
  admins: [{
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
  }],
  
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
LocalAdvertiserSchema.index({ network_id: 1, name: 1 }, { unique: true });
LocalAdvertiserSchema.index({ created_locally: 1 });
LocalAdvertiserSchema.index({ synced_with_api: 1 });

// Virtual getters for IDs
LocalAdvertiserSchema.virtual('mongo_id').get(function (this: any) {
  return this._id?.toString();
});
LocalAdvertiserSchema.virtual('broadstreet_id').get(function (this: any) {
  return this.original_broadstreet_id ?? undefined;
});

// New explicit ID naming per entity
LocalAdvertiserSchema.virtual('local_advertiser_id').get(function (this: any) {
  return this._id?.toString();
});
LocalAdvertiserSchema.virtual('broadstreet_advertiser_id').get(function (this: any) {
  return this.original_broadstreet_id ?? undefined;
});

// Ensure virtuals are present in lean() results
LocalAdvertiserSchema.plugin(leanVirtuals);

export default mongoose.models.LocalAdvertiser || mongoose.model<ILocalAdvertiser>('LocalAdvertiser', LocalAdvertiserSchema);
