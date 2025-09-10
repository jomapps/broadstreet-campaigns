import mongoose, { Schema, Document } from 'mongoose';

export interface IAdvertiser extends Document {
  id: number;
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
  id: {
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
});

// Note: id field already has unique: true which creates an index

export default mongoose.models.Advertiser || mongoose.model<IAdvertiser>('Advertiser', AdvertiserSchema);
