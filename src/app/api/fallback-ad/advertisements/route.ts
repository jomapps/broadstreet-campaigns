import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Advertisement from '@/lib/models/advertisement';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const networkId = searchParams.get('networkId');
    const advertiserId = searchParams.get('advertiserId');
    
    if (!networkId || !advertiserId) {
      return NextResponse.json({
        success: false,
        message: 'Network ID and Advertiser ID are required',
      }, { status: 400 });
    }

    await connectDB();
    
    // Filter advertisements by advertiser name (since we don't have advertiser_id in the model)
    const advertisements = await Advertisement.find({}).sort({ name: 1 }).lean();
    
    return NextResponse.json({
      success: true,
      advertisements,
    });
  } catch (error) {
    console.error('Get advertisements error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch advertisements',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
