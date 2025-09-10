import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Advertiser from '@/lib/models/advertiser';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const networkId = searchParams.get('networkId');
    
    if (!networkId) {
      return NextResponse.json({
        success: false,
        message: 'Network ID is required',
      }, { status: 400 });
    }

    await connectDB();
    
    // For now, get all advertisers since we don't have network association in the model
    // In a real implementation, you'd filter by network
    const advertisers = await Advertiser.find({}).sort({ name: 1 }).lean();
    
    return NextResponse.json({
      success: true,
      advertisers,
    });
  } catch (error) {
    console.error('Get advertisers error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch advertisers',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
