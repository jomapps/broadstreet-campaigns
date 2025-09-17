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
      // For synced campaigns, advertiser_id is numeric broadstreet_id
      Campaign.find({ 
        advertiser_id: Number.isFinite(Number(advertiserId)) ? parseInt(advertiserId) : -99999999
      }).sort({ start_date: -1 }).lean(),
      
      // Get all local campaigns for this advertiser
      // Include local campaigns regardless of sync state; use original_broadstreet_id when present
      // For local campaigns, advertiser_id may be number or string (mongo _id)
      LocalCampaign.find({ 
        $or: [
          { advertiser_id: Number.isFinite(Number(advertiserId)) ? parseInt(advertiserId) : undefined },
          { advertiser_id: advertiserId }
        ].filter((q: any) => q.advertiser_id !== undefined)
      }).sort({ start_date: -1 }).lean()
    ]);
    
    // Shape synced campaigns to expose explicit broadstreet_id and mongo_id fields
    const shapedSyncedCampaigns = (syncedCampaigns as any[]).map((c: any) => {
      const { broadstreet_id: broadstreetId, _id, ...rest } = c;
      return {
        ...rest,
        broadstreet_id: broadstreetId,
        mongo_id: _id?.toString?.() ?? String(_id),
        // Explicit names
        broadstreet_campaign_id: broadstreetId,
        local_campaign_id: _id?.toString?.() ?? String(_id),
      };
    });

    // Convert local campaigns and expose mongo_id (and optional broadstreet_id if synced previously)
    const convertedLocalCampaigns = (localCampaigns as any[]).map((local: any) => {
      const { _id, original_broadstreet_id, ...rest } = local;
      const shaped: any = {
        ...rest,
        mongo_id: _id?.toString?.() ?? String(_id),
        local_campaign_id: _id?.toString?.() ?? String(_id),
      };
      if (typeof original_broadstreet_id === 'number') {
        shaped.broadstreet_id = original_broadstreet_id;
        shaped.broadstreet_campaign_id = original_broadstreet_id;
      }
      return shaped;
    });
    
    // Combine both collections with explicit broadstreet_id/mongo_id only and filter by advertiser_id (supports string or number)
    const allCampaigns = [...shapedSyncedCampaigns, ...convertedLocalCampaigns];
    const campaigns = allCampaigns
      .filter((c: any) => {
        const adv = c?.advertiser_id;
        if (Number.isFinite(Number(advertiserId))) {
          return adv === parseInt(advertiserId);
        }
        return String(adv) === advertiserId;
      })
      .sort((a: any, b: any) => {
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
