import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Campaign from '@/lib/models/campaign';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const advertiserId = searchParams.get('advertiserId');
    
    if (!advertiserId) {
      return NextResponse.json({
        success: false,
        message: 'Advertiser ID is required',
      }, { status: 400 });
    }

    await connectDB();
    const campaigns = await Campaign.find({ 
      advertiser_id: parseInt(advertiserId) 
    }).sort({ start_date: -1 }).lean();
    
    return NextResponse.json({
      success: true,
      campaigns,
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch campaigns',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
