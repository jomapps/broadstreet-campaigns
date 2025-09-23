import mongoose, { Schema, Document } from 'mongoose';
import leanVirtuals from 'mongoose-lean-virtuals';

export interface IAdvertisingRequest extends Document {
  mongo_id: string;
  
  // Request identification
  request_number: string;
  
  // Status workflow
  status: 'New' | 'In Progress' | 'Completed' | 'Cancelled';
  
  // User tracking
  created_by: string;
  assigned_to?: string;
  last_modified_by: string;
  
  // Advertiser Information Section
  advertiser_info: {
    company_name: string;
    contact_person: string;
    email: string;
    phone?: string;
    website?: string;
    notes?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    };
  };
  
  // Advertisement Upload Section
  advertisement: {
    name: string;
    description?: string;
    target_url: string;
    target_audience?: string;
    campaign_goals?: string;
    budget_range?: string;
    preferred_zones?: string[];
    image_files: Array<{
      name: string;
      size: number;
      type: string;
      url?: string;
      dimensions?: { width: number; height: number };
      size_coding?: string;
    }>;
  };
  
  // AI Intelligence Section
  ai_intelligence: {
    target_demographics?: string;
    interests?: string[];
    behavioral_patterns?: string;
    optimal_timing?: string;
    content_preferences?: string;
    competitive_analysis?: string;
    performance_predictions?: string;
  };
  
  // Completion data (when status becomes 'Completed')
  completion_data?: {
    selected_campaign_id?: number;
    selected_advertisement_id?: number;
    completion_notes?: string;
    completed_at?: Date;
    completed_by?: string;
  };
  
  // Audit trail
  status_history: Array<{
    status: 'New' | 'In Progress' | 'Completed' | 'Cancelled';
    changed_by: string;
    changed_at: Date;
    notes?: string;
  }>;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const AdvertisingRequestSchema = new Schema<IAdvertisingRequest>({
  // Request identification
  request_number: {
    type: String,
    required: true,
    unique: true,
  },
  
  // Status workflow
  status: {
    type: String,
    enum: ['New', 'In Progress', 'Completed', 'Cancelled'],
    default: 'New',
    required: true,
  },
  
  // User tracking
  created_by: {
    type: String,
    required: true,
  },
  assigned_to: {
    type: String,
  },
  last_modified_by: {
    type: String,
    required: true,
  },
  
  // Advertiser Information Section
  advertiser_info: {
    company_name: {
      type: String,
      required: true,
      trim: true,
    },
    contact_person: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    address: {
      street: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        trim: true,
      },
      state: {
        type: String,
        trim: true,
      },
      postal_code: {
        type: String,
        trim: true,
      },
      country: {
        type: String,
        trim: true,
      },
    },
  },
  
  // Advertisement Upload Section
  advertisement: {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    target_url: {
      type: String,
      required: true,
      trim: true,
    },
    target_audience: {
      type: String,
      trim: true,
    },
    campaign_goals: {
      type: String,
      trim: true,
    },
    budget_range: {
      type: String,
      trim: true,
    },
    preferred_zones: [{
      type: String,
      trim: true,
    }],
    image_files: [{
      name: {
        type: String,
        required: true,
      },
      size: {
        type: Number,
        required: true,
        min: 0,
        max: 20 * 1024 * 1024, // 20MB limit
      },
      type: {
        type: String,
        required: true,
      },
      url: {
        type: String,
      },
      dimensions: {
        width: {
          type: Number,
          min: 1,
        },
        height: {
          type: Number,
          min: 1,
        },
      },
      size_coding: {
        type: String,
        enum: ['SQ', 'PT', 'LS'],
      },
    }],
  },
  
  // AI Intelligence Section
  ai_intelligence: {
    target_demographics: {
      type: String,
      trim: true,
    },
    interests: [{
      type: String,
      trim: true,
    }],
    behavioral_patterns: {
      type: String,
      trim: true,
    },
    optimal_timing: {
      type: String,
      trim: true,
    },
    content_preferences: {
      type: String,
      trim: true,
    },
    competitive_analysis: {
      type: String,
      trim: true,
    },
    performance_predictions: {
      type: String,
      trim: true,
    },
  },
  
  // Completion data (when status becomes 'Completed')
  completion_data: {
    selected_campaign_id: {
      type: Number,
    },
    selected_advertisement_id: {
      type: Number,
    },
    completion_notes: {
      type: String,
      trim: true,
    },
    completed_at: {
      type: Date,
    },
    completed_by: {
      type: String,
    },
  },
  
  // Audit trail
  status_history: [{
    status: {
      type: String,
      enum: ['New', 'In Progress', 'Completed', 'Cancelled'],
      required: true,
    },
    changed_by: {
      type: String,
      required: true,
    },
    changed_at: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
    },
  }],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  id: false,
});

// Virtual getters for standardized three-tier ID system
AdvertisingRequestSchema.virtual('mongo_id').get(function (this: any) {
  return this._id?.toString();
});

// Ensure virtuals are present in lean() results
AdvertisingRequestSchema.plugin(leanVirtuals);

// Pre-save middleware to generate request number
AdvertisingRequestSchema.pre('save', async function (next) {
  if (this.isNew && !this.request_number) {
    const count = await mongoose.model('AdvertisingRequest').countDocuments();
    this.request_number = `AR-${String(count + 1).padStart(6, '0')}`;
  }
  
  // Initialize status history if not present
  if (this.isNew && (!this.status_history || this.status_history.length === 0)) {
    this.status_history = [{
      status: this.status,
      changed_by: this.created_by,
      changed_at: new Date(),
      notes: 'Request created',
    }];
  }
  
  next();
});

// Index for efficient queries
AdvertisingRequestSchema.index({ status: 1 });
AdvertisingRequestSchema.index({ created_by: 1 });
AdvertisingRequestSchema.index({ request_number: 1 });
AdvertisingRequestSchema.index({ createdAt: -1 });

export default mongoose.models.AdvertisingRequest || mongoose.model<IAdvertisingRequest>('AdvertisingRequest', AdvertisingRequestSchema);
