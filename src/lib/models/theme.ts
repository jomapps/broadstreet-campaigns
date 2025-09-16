import mongoose, { Schema, Document } from 'mongoose';
import leanVirtuals from 'mongoose-lean-virtuals';

export interface ITheme extends Document {
  mongo_id: string;
  name: string;
  description?: string;
  zone_ids: number[]; // Array of Broadstreet zone IDs (synced zones only)
  created_at: Date;
  updated_at: Date;
  zone_count: number; // Virtual field for display
  createdAt: Date;
  updatedAt: Date;
}

const ThemeSchema = new Schema<ITheme>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  zone_ids: [{
    type: Number,
    required: true
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  id: false,
});

// Virtual for zone count
ThemeSchema.virtual('zone_count').get(function() {
  return this.zone_ids?.length || 0;
});

// Virtual getters for IDs
ThemeSchema.virtual('mongo_id').get(function (this: any) {
  return this._id?.toString();
});

// Indexes for performance
ThemeSchema.index({ name: 1 });
ThemeSchema.index({ zone_ids: 1 });
ThemeSchema.index({ createdAt: -1 });

// Ensure virtuals are present in lean() results
ThemeSchema.plugin(leanVirtuals);

export default mongoose.models.Theme || mongoose.model<ITheme>('Theme', ThemeSchema);
