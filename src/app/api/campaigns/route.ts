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
      // Include local campaigns regardless of sync state; use original_broadstreet_id when present
      LocalCampaign.find({ 
        advertiser_id: parseInt(advertiserId)
      }).sort({ start_date: -1 }).lean()
    ]);
    
    // Shape synced campaigns to expose explicit ID fields
    const shapedSyncedCampaigns = (syncedCampaigns as any[]).map((c: any) => {
      const { id: broadstreetId, _id, ...rest } = c;
      return {
        ...rest,
        broadstreet_id: broadstreetId,
        mongo_id: _id?.toString?.() ?? String(_id),
      };
    });

    // Convert local campaigns and expose mongo_id (and optional broadstreet_id if synced previously)
    const convertedLocalCampaigns = (localCampaigns as any[]).map((local: any) => {
      const { _id, original_broadstreet_id, ...rest } = local;
      const shaped: any = {
        ...rest,
        mongo_id: _id?.toString?.() ?? String(_id),
      };
      if (typeof original_broadstreet_id === 'number') {
        shaped.broadstreet_id = original_broadstreet_id;
      }
      return shaped;
    });
    
    // Combine both collections with explicit IDs only
    const campaigns = [...shapedSyncedCampaigns, ...convertedLocalCampaigns].sort((a: any, b: any) => {
      const aTime = a?.start_date ? new Date(a.start_date).getTime() : -Infinity;
      const bTime = b?.start_date ? new Date(b.start_date).getTime() : -Infinity;
      return bTime - aTime;
    });
    
    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}
