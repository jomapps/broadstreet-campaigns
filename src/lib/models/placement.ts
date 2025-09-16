import mongoose, { Schema, Document } from 'mongoose';

export interface IPlacement extends Document {
  // Entity relationships - all required for clear data lineage
  network_id: number;           // Always Broadstreet ID (guaranteed to exist)
  advertiser_id: number;        // Always Broadstreet ID (guaranteed to exist)
  advertisement_id: number;     // Always Broadstreet ID (guaranteed to exist)

  // Campaign reference - flexible for local/synced campaigns
  campaign_id?: number;         // Broadstreet ID (if synced campaign)
  campaign_mongo_id?: string;   // MongoDB ObjectId (if local campaign)

  // Zone reference - flexible for local/synced zones
  zone_id?: number;             // Broadstreet ID (if synced zone)
  zone_mongo_id?: string;       // MongoDB ObjectId (if local zone)

  // Optional placement configuration
  restrictions?: string[];

  // Local tracking metadata
  created_locally: boolean;
  synced_with_api: boolean;
  created_at: Date;
  synced_at?: Date;
  sync_errors?: string[];

  // Mongoose timestamps
  createdAt: Date;
  updatedAt: Date;
}

const PlacementSchema = new Schema<IPlacement>({
  // Entity relationships - all required for clear data lineage
  network_id: {
    type: Number,
    required: true,
  },
  advertiser_id: {
    type: Number,
    required: true,
  },
  advertisement_id: {
    type: Number,
    required: true,
  },

  // Campaign reference - exactly one required (XOR constraint)
  campaign_id: {
    type: Number,
    required: false,
  },
  campaign_mongo_id: {
    type: String,
    required: false,
  },

  // Zone reference - exactly one required (XOR constraint)
  zone_id: {
    type: Number,
    required: false,
  },
  zone_mongo_id: {
    type: String,
    required: false,
  },

  // Optional placement configuration
  restrictions: [{
    type: String,
  }],

  // Local tracking metadata
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
  sync_errors: {
    type: [String],
    default: [],
  },
}, {
  timestamps: true,
});

// Validation for XOR constraints
PlacementSchema.pre('validate', function(next) {
  // Exactly one campaign reference required
  const hasCampaignId = !!this.campaign_id;
  const hasCampaignMongoId = !!this.campaign_mongo_id;

  if (hasCampaignId === hasCampaignMongoId) {
    return next(new Error('Exactly one of campaign_id or campaign_mongo_id must be provided'));
  }

  // Exactly one zone reference required
  const hasZoneId = !!this.zone_id;
  const hasZoneMongoId = !!this.zone_mongo_id;

  if (hasZoneId === hasZoneMongoId) {
    return next(new Error('Exactly one of zone_id or zone_mongo_id must be provided'));
  }

  next();
});

// Create compound indexes for unique placements (covering both ID types)
// For Broadstreet campaign + Broadstreet zone
PlacementSchema.index({
  advertisement_id: 1,
  zone_id: 1,
  campaign_id: 1
}, {
  unique: true,
  partialFilterExpression: {
    zone_id: { $exists: true },
    campaign_id: { $exists: true }
  }
});

// For Broadstreet campaign + Local zone
PlacementSchema.index({
  advertisement_id: 1,
  zone_mongo_id: 1,
  campaign_id: 1
}, {
  unique: true,
  partialFilterExpression: {
    zone_mongo_id: { $exists: true },
    campaign_id: { $exists: true }
  }
});

// For Local campaign + Broadstreet zone
PlacementSchema.index({
  advertisement_id: 1,
  zone_id: 1,
  campaign_mongo_id: 1
}, {
  unique: true,
  partialFilterExpression: {
    zone_id: { $exists: true },
    campaign_mongo_id: { $exists: true }
  }
});

// For Local campaign + Local zone
PlacementSchema.index({
  advertisement_id: 1,
  zone_mongo_id: 1,
  campaign_mongo_id: 1
}, {
  unique: true,
  partialFilterExpression: {
    zone_mongo_id: { $exists: true },
    campaign_mongo_id: { $exists: true }
  }
});

// Create individual indexes for faster queries
PlacementSchema.index({ network_id: 1 });
PlacementSchema.index({ advertiser_id: 1 });
PlacementSchema.index({ advertisement_id: 1 });
PlacementSchema.index({ campaign_id: 1 });
PlacementSchema.index({ campaign_mongo_id: 1 });
PlacementSchema.index({ zone_id: 1 });
PlacementSchema.index({ zone_mongo_id: 1 });
PlacementSchema.index({ created_locally: 1 });
PlacementSchema.index({ synced_with_api: 1 });

export default mongoose.models.Placement || mongoose.model<IPlacement>('Placement', PlacementSchema);
