import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Placement from '@/lib/models/placement';
import Advertisement from '@/lib/models/advertisement';
import Campaign from '@/lib/models/campaign';
import Zone from '@/lib/models/zone';
import Advertiser from '@/lib/models/advertiser';
import Network from '@/lib/models/network';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const networkId = searchParams.get('network_id');
    const advertiserId = searchParams.get('advertiser_id');
    const campaignId = searchParams.get('campaign_id');
    
    // Build query based on filters
    let query: any = {};
    
    if (campaignId) {
      query.campaign_id = parseInt(campaignId);
    }
    
    if (advertiserId) {
      // Get campaigns for this advertiser first
      const campaigns = await Campaign.find({ advertiser_id: parseInt(advertiserId) }).lean();
      const campaignIds = campaigns.map(c => c.id);
      if (campaignIds.length > 0) {
        query.campaign_id = { $in: campaignIds };
      } else {
        // No campaigns for this advertiser, return empty result
        return NextResponse.json({
          success: true,
          placements: [],
        });
      }
    }
    
    if (networkId) {
      // Get zones for this network first
      const zones = await Zone.find({ network_id: parseInt(networkId) }).lean();
      const zoneIds = zones.map(z => z.id);
      if (zoneIds.length > 0) {
        query.zone_id = { $in: zoneIds };
      } else {
        // No zones for this network, return empty result
        return NextResponse.json({
          success: true,
          placements: [],
        });
      }
    }
    
    const placements = await Placement.find(query).sort({ createdAt: -1 }).lean();
    
    // Enrich placements with related data
    const enrichedPlacements = await Promise.all(
      placements.map(async (placement) => {
        // Get related data
        const [advertisement, campaign, zone] = await Promise.all([
          Advertisement.findOne({ id: placement.advertisement_id }).lean(),
          Campaign.findOne({ id: placement.campaign_id }).lean(),
          Zone.findOne({ id: placement.zone_id }).lean(),
        ]);
        
        // Get advertiser and network info
        let advertiser = null;
        let network = null;
        
        if (campaign) {
          advertiser = await Advertiser.findOne({ id: campaign.advertiser_id }).lean();
        }
        
        if (zone) {
          network = await Network.findOne({ id: zone.network_id }).lean();
        }
        
        return {
          ...placement,
          advertisement: advertisement ? {
            id: advertisement.id,
            name: advertisement.name,
            type: advertisement.type,
            preview_url: advertisement.preview_url,
          } : null,
          campaign: campaign ? {
            id: campaign.id,
            name: campaign.name,
            start_date: campaign.start_date,
            end_date: campaign.end_date,
            active: campaign.active,
          } : null,
          zone: zone ? {
            id: zone.id,
            name: zone.name,
            alias: zone.alias,
            size_type: zone.size_type,
            size_number: zone.size_number,
          } : null,
          advertiser: advertiser ? {
            id: advertiser.id,
            name: advertiser.name,
          } : null,
          network: network ? {
            id: network.id,
            name: network.name,
          } : null,
        };
      })
    );
    
    return NextResponse.json({
      success: true,
      placements: enrichedPlacements,
    });
  } catch (error) {
    console.error('Get placements error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch placements',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
