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
}, {
  timestamps: true,
});

// Note: id field already has unique: true which creates an index

export default mongoose.models.Network || mongoose.model<INetwork>('Network', NetworkSchema);
