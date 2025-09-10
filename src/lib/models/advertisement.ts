import mongoose, { Schema, Document } from 'mongoose';

export interface IAdvertisement extends Document {
  id: number;
  name: string;
  updated_at: string;
  type: string;
  advertiser: string;
  active: {
    url?: string | null;
  };
  active_placement: boolean;
  preview_url: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdvertisementSchema = new Schema<IAdvertisement>({
  id: {
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
}, {
  timestamps: true,
});

// Create indexes for faster queries
// Note: id field already has unique: true which creates an index
AdvertisementSchema.index({ advertiser: 1 });
AdvertisementSchema.index({ type: 1 });
AdvertisementSchema.index({ active_placement: 1 });

export default mongoose.models.Advertisement || mongoose.model<IAdvertisement>('Advertisement', AdvertisementSchema);
