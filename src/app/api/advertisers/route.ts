import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Advertiser from '@/lib/models/advertiser';
import Placement from '@/lib/models/placement';
import Zone from '@/lib/models/zone';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const networkId = searchParams.get('network_id');
    
    let advertiserIds: number[] = [];
    
    if (networkId) {
      // Get zones for the network
      const zones = await Zone.find({ network_id: parseInt(networkId) }).lean();
      const zoneIds = zones.map(z => z.id);
      
      if (zoneIds.length > 0) {
        // Get placements for these zones
        const placements = await Placement.find({ zone_id: { $in: zoneIds } }).lean();
        const campaignIds = [...new Set(placements.map(p => p.campaign_id))];
        
        // Get advertisers from campaigns (we'll need to join with campaigns)
        // For now, let's get all advertisers and filter by network through placements
        const allAdvertisers = await Advertiser.find({}).lean();
        
        // Filter advertisers that have campaigns with placements in this network
        const filteredAdvertiserIds = new Set<number>();
        
        for (const placement of placements) {
          // We need to get the campaign to find the advertiser_id
          // This is a simplified approach - in a real app you'd want to optimize this query
          const campaign = await import('@/lib/models/campaign').then(m => m.default);
          const campaignDoc = await campaign.findOne({ id: placement.campaign_id }).lean();
          if (campaignDoc) {
            filteredAdvertiserIds.add(campaignDoc.advertiser_id);
          }
        }
        
        advertiserIds = Array.from(filteredAdvertiserIds);
      }
    }
    
    let query = {};
    if (advertiserIds.length > 0) {
      query = { id: { $in: advertiserIds } };
    }
    
    const advertisers = await Advertiser.find(query).sort({ name: 1 }).lean();
    
    return NextResponse.json({ advertisers });
  } catch (error) {
    console.error('Error fetching advertisers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch advertisers' },
      { status: 500 }
    );
  }
}
