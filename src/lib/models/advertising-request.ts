import mongoose, { Schema, Document } from 'mongoose';
import leanVirtuals from 'mongoose-lean-virtuals';

export interface IAdvertisingRequest extends Document {
  // MongoDB identifiers
  _id: mongoose.Types.ObjectId;
  mongo_id: string; // Virtual field: _id.toString()

  // User tracking
  created_by_user_id: string; // Clerk user ID
  created_by_user_name: string; // Clerk user display name
  created_by_user_email: string; // Clerk user email

  // Status and workflow
  status: 'new' | 'in_progress' | 'completed' | 'cancelled';
  status_history: Array<{
    status: string;
    changed_by_user_id: string;
    changed_by_user_name: string;
    changed_by_user_email: string;
    changed_at: Date;
    notes?: string;
  }>;

  // Advertiser Information
  advertiser_name: string; // Required
  advertiser_id: string; // Required - Sales dept ID
  contract_id: string; // Required
  contract_start_date: Date; // Required
  contract_end_date?: Date; // Optional
  campaign_name: string; // Required

  // Advertisement Information (array of ads)
  advertisements: Array<{
    // File information
    image_url: string; // Cloudflare R2 public URL
    image_name: string; // Original/edited filename
    image_alt_text: string; // Auto-generated, editable

    // Image properties
    width: number; // Auto-detected
    height: number; // Auto-detected
    file_size: number; // In bytes
    mime_type: string; // e.g., 'image/jpeg'

    // Size coding
    size_coding: 'SQ' | 'PT' | 'LS'; // Auto-selected, editable

    // Advertisement details
    advertisement_name: string; // Auto-generated
    target_url: string; // Required, validated URL
    html_code?: string; // Optional tracking code

    // Upload metadata
    uploaded_at: Date;
    r2_key: string; // Internal R2 object key
  }>;

  // Marketing information
  ad_areas_sold: string[]; // Required, min 1
  themes?: string[]; // Optional

  // AI Intelligence
  keywords?: string[]; // Optional
  info_url?: string; // Optional, validated URL
  extra_info?: string; // Optional

  // Completion tracking
  completed_campaign_id?: number; // Broadstreet campaign ID when completed
  completed_advertisement_ids?: number[]; // Broadstreet ad IDs when completed
  completed_by_user_id?: string; // Clerk user ID who completed
  completed_by_user_name?: string; // Clerk user name who completed
  completed_at?: Date;

  // Timestamps
  created_at: Date;
  updated_at: Date;
}

const AdvertisingRequestSchema = new Schema<IAdvertisingRequest>({
  // User tracking
  created_by_user_id: {
    type: String,
    required: true,
  },
  created_by_user_name: {
    type: String,
    required: true,
  },
  created_by_user_email: {
    type: String,
    required: true,
  },

  // Status and workflow
  status: {
    type: String,
    enum: ['new', 'in_progress', 'completed', 'cancelled'],
    default: 'new',
    required: true,
  },
  status_history: [{
    status: {
      type: String,
      required: true,
    },
    changed_by_user_id: {
      type: String,
      required: true,
    },
    changed_by_user_name: {
      type: String,
      required: true,
    },
    changed_by_user_email: {
      type: String,
      required: true,
    },
    changed_at: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
    },
  }],

  // Advertiser Information
  advertiser_name: {
    type: String,
    required: true,
    trim: true,
  },
  advertiser_id: {
    type: String,
    required: true,
    trim: true,
  },
  contract_id: {
    type: String,
    required: true,
    trim: true,
  },
  contract_start_date: {
    type: Date,
    required: true,
  },
  contract_end_date: {
    type: Date,
    required: false,
  },
  campaign_name: {
    type: String,
    required: true,
    trim: true,
  },

  // Advertisement Information
  advertisements: {
    type: [{
      // File information
      image_url: {
        type: String,
        required: true,
      },
      image_name: {
        type: String,
        required: true,
      },
      image_alt_text: {
        type: String,
        required: true,
      },

      // Image properties
      width: {
        type: Number,
        required: true,
        min: 1,
      },
      height: {
        type: Number,
        required: true,
        min: 1,
      },
      file_size: {
        type: Number,
        required: true,
        min: 0,
        max: 20 * 1024 * 1024, // 20MB limit
      },
      mime_type: {
        type: String,
        required: true,
      },

      // Size coding
      size_coding: {
        type: String,
        enum: ['SQ', 'PT', 'LS'],
        required: true,
      },

      // Advertisement details
      advertisement_name: {
        type: String,
        required: true,
      },
      target_url: {
        type: String,
        required: true,
      },
      html_code: {
        type: String,
      },

      // Upload metadata
      uploaded_at: {
        type: Date,
        default: Date.now,
      },
      r2_key: {
        type: String,
        required: true,
      },
    }],
    required: true,
    validate: {
      validator: function(v: any[]) {
        return v && v.length > 0;
      },
      message: 'At least one advertisement is required',
    },
  },

  // Marketing information
  ad_areas_sold: {
    type: [String],
    required: true,
    validate: {
      validator: function(v: string[]) {
        return v && v.length > 0;
      },
      message: 'At least one ad area is required',
    },
  },
  themes: {
    type: [String],
  },

  // AI Intelligence
  keywords: {
    type: [String],
  },
  info_url: {
    type: String,
    trim: true,
  },
  extra_info: {
    type: String,
    trim: true,
  },

  // Completion tracking
  completed_campaign_id: {
    type: Number,
  },
  completed_advertisement_ids: {
    type: [Number],
  },
  completed_by_user_id: {
    type: String,
  },
  completed_by_user_name: {
    type: String,
  },
  completed_at: {
    type: Date,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  id: false,
});

// Virtual getters for standardized ID system
AdvertisingRequestSchema.virtual('mongo_id').get(function (this: any) {
  return this._id?.toString();
});

// Ensure virtuals are present in lean() results
AdvertisingRequestSchema.plugin(leanVirtuals);

// Pre-save middleware to initialize status history
AdvertisingRequestSchema.pre('save', async function (next) {
  // Initialize status history if not present
  if (this.isNew && (!this.status_history || this.status_history.length === 0)) {
    this.status_history = [{
      status: this.status,
      changed_by_user_id: this.created_by_user_id,
      changed_by_user_name: this.created_by_user_name,
      changed_by_user_email: this.created_by_user_email,
      changed_at: new Date(),
      notes: 'Request created',
    }];
  }

  next();
});

// Indexes for efficient queries
AdvertisingRequestSchema.index({ status: 1 });
AdvertisingRequestSchema.index({ created_by_user_id: 1 });
AdvertisingRequestSchema.index({ created_at: -1 });
AdvertisingRequestSchema.index({ advertiser_name: 1 });

export default mongoose.models.AdvertisingRequest || mongoose.model<IAdvertisingRequest>('AdvertisingRequest', AdvertisingRequestSchema);