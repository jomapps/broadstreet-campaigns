import mongoose, { Schema, Document } from 'mongoose';

export interface ICampaign extends Document {
  id: number;
  name: string;
  advertiser_id: number;
  start_date: string;
  end_date?: string;
  max_impression_count?: number;
  display_type: 'no_repeat' | 'allow_repeat_campaign' | 'allow_repeat_advertisement' | 'force_repeat_campaign';
  active: boolean;
  weight: number;
  path: string;
  archived?: boolean;
  pacing_type?: 'asap' | 'even';
  impression_max_type?: 'cap' | 'goal';
  paused?: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>({
  id: {
    type: Number,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  advertiser_id: {
    type: Number,
    required: true,
  },
  start_date: {
    type: String,
    required: true,
  },
  end_date: {
    type: String,
  },
  max_impression_count: {
    type: Number,
  },
  display_type: {
    type: String,
    enum: ['no_repeat', 'allow_repeat_campaign', 'allow_repeat_advertisement', 'force_repeat_campaign'],
    required: true,
  },
  active: {
    type: Boolean,
    required: true,
  },
  weight: {
    type: Number,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  archived: {
    type: Boolean,
    default: false,
  },
  pacing_type: {
    type: String,
    enum: ['asap', 'even'],
  },
  impression_max_type: {
    type: String,
    enum: ['cap', 'goal'],
  },
  paused: {
    type: Boolean,
    default: false,
  },
  notes: {
    type: String,
  },
}, {
  timestamps: true,
});

// Create indexes for faster queries
CampaignSchema.index({ id: 1 });
CampaignSchema.index({ advertiser_id: 1 });
CampaignSchema.index({ active: 1 });

export default mongoose.models.Campaign || mongoose.model<ICampaign>('Campaign', CampaignSchema);
