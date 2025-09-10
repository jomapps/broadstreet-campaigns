import mongoose, { Schema, Document } from 'mongoose';

export interface ICampaign extends Document {
  id: number;
  name: string;
  advertiser_id: number;
  start_date?: string;
  end_date?: string;
  max_impression_count?: number;
  display_type?: 'no_repeat' | 'allow_repeat_campaign' | 'allow_repeat_advertisement' | 'force_repeat_campaign';
  active: boolean;
  weight?: number;
  path: string;
  archived?: boolean;
  pacing_type?: 'asap' | 'even';
  impression_max_type?: 'cap' | 'goal';
  paused?: boolean;
  notes?: string;
  placements?: Array<{
    advertisement_id: number;
    zone_id: number;
    restrictions?: string[];
  }>;
  // Raw fields to preserve API payload for future write-backs
  weight_raw?: string;
  display_type_raw?: string;
  start_date_raw?: string;
  end_date_raw?: string;
  raw?: Record<string, unknown>;
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
  },
  active: {
    type: Boolean,
    required: true,
  },
  weight: {
    type: Number,
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
  placements: [{
    advertisement_id: {
      type: Number,
      required: true,
    },
    zone_id: {
      type: Number,
      required: true,
    },
    restrictions: [{
      type: String,
    }],
  }],
  // Preserve raw API values for robust round-tripping
  weight_raw: {
    type: String,
  },
  display_type_raw: {
    type: String,
  },
  start_date_raw: {
    type: String,
  },
  end_date_raw: {
    type: String,
  },
  raw: {
    type: Schema.Types.Mixed,
  },
}, {
  timestamps: true,
});

// Create indexes for faster queries
// Note: id field already has unique: true which creates an index
CampaignSchema.index({ advertiser_id: 1 });
CampaignSchema.index({ active: 1 });

export default mongoose.models.Campaign || mongoose.model<ICampaign>('Campaign', CampaignSchema);
