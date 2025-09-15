import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Campaign from '@/lib/models/campaign';
import LocalCampaign from '@/lib/models/local-campaign';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { campaign_id } = await request.json();
    if (typeof campaign_id !== 'number') {
      return NextResponse.json({ message: 'campaign_id (number) is required' }, { status: 400 });
    }

    // If mirror exists, return it
    const existing = (await LocalCampaign.findOne({ original_broadstreet_id: campaign_id }).lean()) as any;
    if (existing) {
      return NextResponse.json({ message: 'Mirror exists', campaign: { _id: (existing as any)._id?.toString?.() } }, { status: 200 });
    }

    // Find source campaign
    const source = await Campaign.findOne({ id: campaign_id }).lean();
    if (!source) {
      return NextResponse.json({ message: 'Source campaign not found' }, { status: 404 });
    }

    // Create mirror using selected fields
    const mirror = await LocalCampaign.create({
      name: (source as any).name,
      network_id: (source as any).network_id,
      advertiser_id: (source as any).advertiser_id,
      start_date: (source as any).start_date,
      end_date: (source as any).end_date,
      max_impression_count: (source as any).max_impression_count,
      display_type: (source as any).display_type,
      active: (source as any).active,
      weight: (source as any).weight,
      path: (source as any).path,
      archived: (source as any).archived,
      pacing_type: (source as any).pacing_type,
      impression_max_type: (source as any).impression_max_type,
      paused: (source as any).paused,
      notes: (source as any).notes,
      placements: [],
      created_locally: false,
      synced_with_api: false,
      original_broadstreet_id: campaign_id,
      sync_errors: [],
    });

    return NextResponse.json({ message: 'Mirror created', campaign: { _id: mirror._id.toString() } }, { status: 201 });
  } catch (error) {
    console.error('Mirror LocalCampaign error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


