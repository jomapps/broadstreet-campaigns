import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Advertiser from '@/lib/models/advertiser';
import LocalAdvertiser from '@/lib/models/local-advertiser';
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
          const campaignDoc = await campaign.findOne({ id: placement.campaign_id }).lean() as { advertiser_id: number } | null;
          if (campaignDoc) {
            filteredAdvertiserIds.add(campaignDoc.advertiser_id);
          }
        }
        
        advertiserIds = Array.from(filteredAdvertiserIds);
      }
      
      // Also include locally created advertisers for this network (those not yet synced)
      const localAdvertisers = await Advertiser.find({ 
        network_id: parseInt(networkId),
        synced_with_api: false 
      }).lean();
      
      const localAdvertiserIds = localAdvertisers.map(a => a.id);
      advertiserIds = [...new Set([...advertiserIds, ...localAdvertiserIds])];
      
      // If no advertisers found through placements/zones, get all advertisers for this network
      // This handles cases where there are no zones/placements yet, or we want to show all network advertisers
      if (advertiserIds.length === 0) {
        const networkAdvertisers = await Advertiser.find({ 
          network_id: parseInt(networkId) 
        }).lean();
        advertiserIds = networkAdvertisers.map(a => a.id);
      }
    }
    
    // Get advertisers from main Advertiser collection
    let query = {};
    if (advertiserIds.length > 0) {
      query = { id: { $in: advertiserIds } };
    }
    
    const [mainAdvertisers, localAdvertisers] = await Promise.all([
      Advertiser.find(query).sort({ name: 1 }).lean(),
      networkId ? LocalAdvertiser.find({ 
        network_id: parseInt(networkId),
        synced_with_api: false 
      }).sort({ name: 1 }).lean() : []
    ]);
    
    // Convert local advertisers to the same format as main advertisers for display
    const convertedLocalAdvertisers = localAdvertisers.map(local => ({
      id: local._id.toString(), // Use _id as id for local advertisers
      name: local.name,
      network_id: local.network_id,
      web_home_url: local.web_home_url,
      notes: local.notes,
      admins: local.admins,
      created_locally: local.created_locally,
      synced_with_api: local.synced_with_api,
      created_at: local.created_at,
      _id: local._id,
      sync_errors: local.sync_errors,
    }));
    
    // Combine both collections
    const advertisers = [...mainAdvertisers, ...convertedLocalAdvertisers].sort((a, b) => a.name.localeCompare(b.name));
    
    return NextResponse.json({ advertisers });
  } catch (error) {
    console.error('Error fetching advertisers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch advertisers' },
      { status: 500 }
    );
  }
}
