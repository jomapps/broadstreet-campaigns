import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Campaign from '@/lib/models/campaign';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const advertiserId = searchParams.get('advertiser_id');
    
    let query = {};
    if (advertiserId) {
      query = { advertiser_id: parseInt(advertiserId) };
    }
    
    const campaigns = await Campaign.find(query).sort({ start_date: -1 }).lean();
    
    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}
