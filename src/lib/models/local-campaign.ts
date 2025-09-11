import mongoose, { Document, Schema } from 'mongoose';

export interface ILocalCampaign extends Document {
  // Core Broadstreet API fields
  name: string;
  network_id: number;
  advertiser_id?: number;
  start_date?: string;
  end_date?: string;
  max_impression_count?: number;
  display_type?: 'no_repeat' | 'allow_repeat_campaign' | 'allow_repeat_advertisement' | 'force_repeat_campaign';
  active: boolean;
  weight?: number;
  path?: string;
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

const LocalCampaignSchema = new Schema<ILocalCampaign>({
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
    min: 0,
  },
  display_type: {
    type: String,
    enum: ['no_repeat', 'allow_repeat_campaign', 'allow_repeat_advertisement', 'force_repeat_campaign'],
  },
  active: {
    type: Boolean,
    default: true,
  },
  weight: {
    type: Number,
    required: true,
    min: 0,
  },
  path: {
    type: String,
    trim: true,
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
    trim: true,
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
});

// Indexes for performance
LocalCampaignSchema.index({ network_id: 1, name: 1 }, { unique: true });
LocalCampaignSchema.index({ advertiser_id: 1 });
LocalCampaignSchema.index({ created_locally: 1 });
LocalCampaignSchema.index({ synced_with_api: 1 });

export default mongoose.models.LocalCampaign || mongoose.model<ILocalCampaign>('LocalCampaign', LocalCampaignSchema);
