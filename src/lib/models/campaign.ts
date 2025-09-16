import mongoose, { Schema, Document } from 'mongoose';
import leanVirtuals from 'mongoose-lean-virtuals';
import { mapApiIds } from '@/lib/types/mapApiIds';

export interface ICampaign extends Document {
  broadstreet_id: number;
  mongo_id: string;
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
  // Creation and sync tracking
  created_locally?: boolean;
  synced_with_api?: boolean;
  created_at?: Date;
  synced_at?: Date;
  network_id?: number;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>({
  broadstreet_id: {
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

// Create indexes for faster queries
// Note: broadstreet_id field already has unique: true which creates an index
CampaignSchema.index({ advertiser_id: 1 });
CampaignSchema.index({ active: 1 });

// Virtual getters for standardized three-tier ID system
CampaignSchema.virtual('mongo_id').get(function (this: any) {
  return this._id?.toString();
});
CampaignSchema.virtual('broadstreet_network_id').get(function (this: any) {
  return this.network_id;
});

// Ensure virtuals are present in lean() results
CampaignSchema.plugin(leanVirtuals);

// Temporary static to safely map API payloads
CampaignSchema.statics.fromApi = function fromApi(payload: any) {
  const mapped = mapApiIds(payload, { stripId: false });
  return mapped;
};

export default mongoose.models.Campaign || mongoose.model<ICampaign>('Campaign', CampaignSchema);
