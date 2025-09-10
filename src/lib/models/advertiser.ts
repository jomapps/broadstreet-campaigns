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
}, {
  timestamps: true,
});

// Create index on the id field for faster queries
AdvertiserSchema.index({ id: 1 });

export default mongoose.models.Advertiser || mongoose.model<IAdvertiser>('Advertiser', AdvertiserSchema);
