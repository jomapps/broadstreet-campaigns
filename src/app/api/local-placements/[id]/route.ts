import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Placement from '@/lib/models/placement';
import { Types } from 'mongoose';

// DELETE /api/local-placements/[id] - Delete individual local placement
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const { id } = params;
    
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid placement ID format' },
        { status: 400 }
      );
    }
    
    // Find and delete the placement
    const placement = await Placement.findOneAndDelete({
      _id: id,
      created_locally: true // Only allow deletion of local placements
    });
    
    if (!placement) {
      return NextResponse.json(
        { error: 'Local placement not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: 'Local placement deleted successfully',
      placement: placement.toObject()
    });
    
  } catch (error) {
    console.error('Error deleting local placement:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/local-placements/[id] - Get individual local placement
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const { id } = params;
    
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid placement ID format' },
        { status: 400 }
      );
    }
    
    // Find the placement
    const placement = await Placement.findOne({
      _id: id,
      created_locally: true
    }).lean();
    
    if (!placement) {
      return NextResponse.json(
        { error: 'Local placement not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      placement
    });
    
  } catch (error) {
    console.error('Error fetching local placement:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
