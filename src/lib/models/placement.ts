import mongoose, { Schema, Document } from 'mongoose';

export interface IPlacement extends Document {
  advertisement_id: number;
  zone_id: number;
  campaign_id: number;
  restrictions?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const PlacementSchema = new Schema<IPlacement>({
  advertisement_id: {
    type: Number,
    required: true,
  },
  zone_id: {
    type: Number,
    required: true,
  },
  campaign_id: {
    type: Number,
    required: true,
  },
  restrictions: [{
    type: String,
  }],
}, {
  timestamps: true,
});

// Create compound index for unique placements
PlacementSchema.index({ 
  advertisement_id: 1, 
  zone_id: 1, 
  campaign_id: 1 
}, { unique: true });

// Create individual indexes for faster queries
PlacementSchema.index({ campaign_id: 1 });
PlacementSchema.index({ advertisement_id: 1 });
PlacementSchema.index({ zone_id: 1 });

export default mongoose.models.Placement || mongoose.model<IPlacement>('Placement', PlacementSchema);
