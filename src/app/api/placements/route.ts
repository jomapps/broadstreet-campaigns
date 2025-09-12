import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Advertisement from '@/lib/models/advertisement';
import Campaign from '@/lib/models/campaign';
import Zone from '@/lib/models/zone';
import Advertiser from '@/lib/models/advertiser';
import Network from '@/lib/models/network';
import LocalCampaign from '@/lib/models/local-campaign';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const networkId = searchParams.get('network_id');
    const advertiserId = searchParams.get('advertiser_id');
    const campaignId = searchParams.get('campaign_id');
    const campaignMongoId = searchParams.get('campaign_mongo_id');
    
    // Build campaign query based on filters
    const campaignQuery: Record<string, unknown> = {};
    if (campaignId) campaignQuery.id = parseInt(campaignId);
    if (advertiserId) campaignQuery.advertiser_id = parseInt(advertiserId);

    // Fetch synced campaigns unless a specific local campaign is requested
    const campaigns = campaignMongoId ? [] : await Campaign.find(campaignQuery).lean();

    // Also fetch local campaigns that match advertiser filter and optionally map to a specific campaign id via original_broadstreet_id
    const localQuery: Record<string, unknown> = {};
    if (advertiserId) localQuery.advertiser_id = parseInt(advertiserId);
    if (campaignId) localQuery.original_broadstreet_id = parseInt(campaignId);
    if (campaignMongoId) (localQuery as any)._id = campaignMongoId; // could use new Types.ObjectId(campaignMongoId)
    const localCampaigns = await LocalCampaign.find(localQuery).lean();

    // Collect all placements from both sources
    const allPlacements: Array<{
      advertisement_id: number;
      zone_id: number;
      restrictions?: string[];
      campaign_id: number;
      _localCampaign?: {
        id: string;
        name: string;
        start_date?: string;
        end_date?: string;
        active: boolean;
        advertiser_id?: number;
      };
    }> = [];

    // From synced campaigns
    for (const campaign of campaigns) {
      if (campaign.placements && campaign.placements.length > 0) {
        for (const placement of campaign.placements as any[]) {
          allPlacements.push({
            advertisement_id: (placement as any).advertisement_id,
            zone_id: (placement as any).zone_id,
            restrictions: (placement as any).restrictions,
            campaign_id: (campaign as any).id,
          });
        }
      }
    }

    // From local campaigns (embedded placements)
    for (const lc of localCampaigns) {
      if (lc.placements && lc.placements.length > 0) {
        for (const placement of lc.placements as any[]) {
          allPlacements.push({
            advertisement_id: (placement as any).advertisement_id,
            zone_id: (placement as any).zone_id,
            restrictions: (placement as any).restrictions,
            campaign_id: (lc as any).original_broadstreet_id || 0,
            _localCampaign: {
              id: (lc as any)._id.toString(),
              name: (lc as any).name,
              start_date: (lc as any).start_date,
              end_date: (lc as any).end_date,
              active: (lc as any).active,
              advertiser_id: (lc as any).advertiser_id,
            },
          });
        }
      }
    }
    
    // Deduplicate across synced/local to avoid duplicates
    const seen = new Set<string>();
    const deduped: typeof allPlacements = [];
    for (const p of allPlacements) {
      const key = `${p.campaign_id}-${p.advertisement_id}-${p.zone_id}`;
      if (!seen.has(key)) { seen.add(key); deduped.push(p); }
    }
    
    // Build unique id sets for batch fetching
    const adIds = Array.from(new Set(deduped.map(p => p.advertisement_id)));
    const zoneIds = Array.from(new Set(deduped.map(p => p.zone_id)));
    const campaignIds = Array.from(new Set(deduped.map(p => p.campaign_id)));
    
    // Fetch related entities in batches
    const [ads, zones, campaignsById] = await Promise.all([
      Advertisement.find({ id: { $in: adIds } }).lean(),
      Zone.find({ id: { $in: zoneIds } }).lean(),
      Campaign.find({ id: { $in: campaignIds } }).lean(),
    ]);
    
    // Build lookup maps
    const adMap = new Map<number, any>(ads.map((a: any) => [a.id, a]));
    const zoneMap = new Map<number, any>(zones.map((z: any) => [z.id, z]));
    const campaignMap = new Map<number, any>(campaignsById.map((c: any) => [c.id, c]));
    
    // Optional filter by networkId using zoneMap
    const filtered = networkId
      ? deduped.filter(p => {
          const z = zoneMap.get(p.zone_id);
          return z && z.network_id === parseInt(networkId);
        })
      : deduped;
    
    // Batch advertiser and network lookups
    const advertiserIds = Array.from(new Set(
      filtered.map(p => {
        const c = campaignMap.get(p.campaign_id);
        return c ? c.advertiser_id : p._localCampaign?.advertiser_id;
      }).filter((v): v is number => typeof v === 'number')
    ));
    const networkIds = Array.from(new Set(
      filtered.map(p => zoneMap.get(p.zone_id)?.network_id).filter((v): v is number => typeof v === 'number')
    ));
    const [advertisers, networks] = await Promise.all([
      Advertiser.find({ id: { $in: advertiserIds } }).lean(),
      Network.find({ id: { $in: networkIds } }).lean(),
    ]);
    const advertiserMap = new Map<number, any>(advertisers.map((a: any) => [a.id, a]));
    const networkMap = new Map<number, any>(networks.map((n: any) => [n.id, n]));

    // Enrich using maps; handle local campaign enrichment
    const enrichedPlacements = filtered.map((placement) => {
      const advertisement = adMap.get(placement.advertisement_id);
      const zone = zoneMap.get(placement.zone_id);
      const campaign = campaignMap.get(placement.campaign_id);
      const local = placement._localCampaign;

      const advertiser = campaign
        ? advertiserMap.get(campaign.advertiser_id)
        : (local?.advertiser_id ? advertiserMap.get(local.advertiser_id) : null);

      const network = zone ? networkMap.get(zone.network_id) : null;

      return {
        ...placement,
        advertisement: advertisement ? {
          id: (advertisement as any).id,
          name: (advertisement as any).name,
          type: (advertisement as any).type,
          preview_url: (advertisement as any).preview_url,
        } : null,
        campaign: local ? {
          id: placement.campaign_id,
          name: local.name,
          start_date: local.start_date,
          end_date: local.end_date,
          active: local.active,
        } : (campaign ? {
          id: (campaign as any).id,
          name: (campaign as any).name,
          start_date: (campaign as any).start_date,
          end_date: (campaign as any).end_date,
          active: (campaign as any).active,
        } : null),
        zone: zone ? {
          id: (zone as any).id,
          name: (zone as any).name,
          alias: (zone as any).alias,
          size_type: (zone as any).size_type,
          size_number: (zone as any).size_number,
        } : null,
        advertiser: advertiser ? {
          id: (advertiser as any).id,
          name: (advertiser as any).name,
        } : null,
        network: network ? {
          id: (network as any).id,
          name: (network as any).name,
        } : null,
      };
    });
    
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
