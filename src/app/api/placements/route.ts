import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
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
    
    // Build campaign query based on filters
    let campaignQuery: any = {};
    
    if (campaignId) {
      campaignQuery.id = parseInt(campaignId);
    }
    
    if (advertiserId) {
      campaignQuery.advertiser_id = parseInt(advertiserId);
    }
    
    // Get campaigns that match the filters
    const campaigns = await Campaign.find(campaignQuery).lean();
    
    if (campaigns.length === 0) {
      return NextResponse.json({
        success: true,
        placements: [],
      });
    }
    
    // Collect all placements from matching campaigns
    const allPlacements: any[] = [];
    
    for (const campaign of campaigns) {
      if (campaign.placements && campaign.placements.length > 0) {
        for (const placement of campaign.placements) {
          // Apply network filter if specified
          if (networkId) {
            const zone = await Zone.findOne({ id: placement.zone_id }).lean();
            if (!zone || zone.network_id !== parseInt(networkId)) {
              continue; // Skip this placement if it doesn't match network filter
            }
          }
          
          allPlacements.push({
            ...placement,
            campaign_id: campaign.id,
          });
        }
      }
    }
    
    // Enrich placements with related data
    const enrichedPlacements = await Promise.all(
      allPlacements.map(async (placement) => {
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
