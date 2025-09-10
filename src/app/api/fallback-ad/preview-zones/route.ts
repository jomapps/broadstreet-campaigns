import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Zone from '@/lib/models/zone';
import { ZoneSize } from '@/lib/types/broadstreet';

export async function POST(request: Request) {
  try {
    const { networkId, sizes }: { networkId: number; sizes: ZoneSize[] } = await request.json();
    
    if (!networkId || !sizes || sizes.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Network ID and sizes are required',
      }, { status: 400 });
    }

    await connectDB();
    
    // Find zones that match the selected sizes
    const zones = await Zone.find({
      network_id: networkId,
      size_type: { $in: sizes }
    }).sort({ name: 1 }).lean();
    
    return NextResponse.json({
      success: true,
      zones,
    });
  } catch (error) {
    console.error('Preview zones error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to preview zones',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
