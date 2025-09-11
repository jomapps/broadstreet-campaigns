import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Campaign from '@/lib/models/campaign';
import LocalCampaign from '@/lib/models/local-campaign';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const advertiserId = searchParams.get('advertiser_id');
    
    if (!advertiserId) {
      return NextResponse.json({ campaigns: [] });
    }
    
    // Get all campaigns for the selected advertiser from local collections only
    const [syncedCampaigns, localCampaigns] = await Promise.all([
      // Get previously synced campaigns stored locally (no live API calls)
      Campaign.find({ 
        advertiser_id: parseInt(advertiserId)
      }).sort({ start_date: -1 }).lean(),
      
      // Get all local campaigns for this advertiser
      LocalCampaign.find({ 
        advertiser_id: parseInt(advertiserId),
        synced_with_api: false 
      }).sort({ start_date: -1 }).lean()
    ]);
    
    // Convert local campaigns to the same format as main campaigns for display
    const convertedLocalCampaigns = localCampaigns.map(local => ({
      id: local._id.toString(), // Use _id as id for local campaigns
      name: local.name,
      advertiser_id: local.advertiser_id,
      start_date: local.start_date,
      end_date: local.end_date,
      active: local.active,
      weight: local.weight,
      max_impression_count: local.max_impression_count,
      notes: local.notes,
      display_type: local.display_type,
      path: local.path,
      created_locally: local.created_locally,
      synced_with_api: local.synced_with_api,
      created_at: local.created_at,
      _id: local._id,
      sync_errors: local.sync_errors,
    }));
    
    // Combine both collections
    const campaigns = [...syncedCampaigns, ...convertedLocalCampaigns].sort((a, b) => 
      new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    );
    
    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}
