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
    const advertisementIdFilter = searchParams.get('advertisement_id');
    const zoneIdFilter = searchParams.get('zone_id');
    const limitParam = searchParams.get('limit');
    const hardLimit = Number.isFinite(Number(limitParam)) ? Math.max(1, Math.min(1000, parseInt(limitParam as string))) : 0;

    // Guardrails in production to avoid heavy unfiltered queries
    const hasAnyFilter = Boolean(networkId || advertiserId || campaignId || campaignMongoId || advertisementIdFilter || zoneIdFilter);
    if (process.env.NODE_ENV === 'production' && !hasAnyFilter && !hardLimit) {
      return NextResponse.json({
        success: false,
        message: 'At least one filter (network_id, advertiser_id, campaign_id, campaign_mongo_id, advertisement_id, or zone_id) is required.',
      }, { status: 400 });
    }
    
    // Validate ObjectId-like campaign_mongo_id early to avoid CastError
    if (campaignMongoId) {
      const { isValidObjectId } = await import('mongoose');
      if (!isValidObjectId(campaignMongoId)) {
        return NextResponse.json({
          success: false,
          message: 'Invalid campaign_mongo_id. Must be a valid Mongo ObjectId.',
        }, { status: 400 });
      }
    }

    // Build campaign query based on filters
    const campaignQuery: Record<string, unknown> = {};
    if (campaignId) campaignQuery.id = parseInt(campaignId);
    if (advertiserId) campaignQuery.advertiser_id = parseInt(advertiserId);
    if (networkId) campaignQuery.network_id = parseInt(networkId);

    // Fetch synced campaigns unless a specific local campaign is requested
    const campaigns = campaignMongoId ? [] : await Campaign.find(campaignQuery).lean();

    // Also fetch local campaigns that match filters and optionally map to a specific campaign id via original_broadstreet_id
    const localQuery: Record<string, unknown> = {};
    if (advertiserId) localQuery.advertiser_id = parseInt(advertiserId);
    if (campaignId) localQuery.original_broadstreet_id = parseInt(campaignId);
    if (campaignMongoId) (localQuery as any)._id = campaignMongoId; // could use new Types.ObjectId(campaignMongoId)
    if (networkId) (localQuery as any).network_id = parseInt(networkId);
    const localCampaigns = await LocalCampaign.find(localQuery).lean();

    // Additionally, if filtering by network, include all campaigns whose advertiser belongs to that network
    if (networkId) {
      const nid = parseInt(networkId);
      const advertisersInNetwork = await Advertiser.find({ network_id: nid }).lean();
      const advertiserIds = advertisersInNetwork.map((a: any) => a.id).filter((v: any) => typeof v === 'number');
      if (advertiserIds.length > 0) {
        const inferred = await Campaign.find({ advertiser_id: { $in: advertiserIds } }).lean();
        const existing = new Set((campaigns as any[]).map(c => (c as any).id));
        for (const c of inferred) {
          if (!existing.has((c as any).id)) (campaigns as any[]).push(c);
        }
      }
    }

    // Collect all placements from both sources
    const allPlacements: Array<{
      advertisement_id: number;
      zone_id: number;
      zone_mongo_id?: string;
      restrictions?: string[];
      campaign_id?: number; // broadstreet_id
      campaign_mongo_id?: string;
      _localCampaign?: {
        mongo_id: string;
        name: string;
        start_date?: string;
        end_date?: string;
        active: boolean;
        advertiser_id?: number;
        broadstreet_id?: number;
      };
    }> = [];

    // From synced campaigns (no remote calls; rely on locally stored placements)
    for (const campaign of campaigns) {
      const placementsArr = Array.isArray((campaign as any).placements) ? ((campaign as any).placements as any[]) : [];
      if (placementsArr.length > 0) {
        for (const placement of placementsArr) {
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
          const numericId = (lc as any).original_broadstreet_id;
          const mongoId = (lc as any)._id.toString();
          allPlacements.push({
            advertisement_id: (placement as any).advertisement_id,
            zone_id: (placement as any).zone_id,
            ...(typeof (placement as any).zone_mongo_id === 'string' ? { zone_mongo_id: (placement as any).zone_mongo_id } : {}),
            restrictions: (placement as any).restrictions,
            ...(typeof numericId === 'number' ? { campaign_id: numericId } : {}),
            campaign_mongo_id: mongoId,
            _localCampaign: {
              mongo_id: mongoId,
              ...(typeof numericId === 'number' ? { broadstreet_id: numericId } : {}),
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
    
    // Deduplicate across synced/local to avoid duplicates. Prefer numeric campaign_id when present; fall back to campaign_mongo_id.
    const seen = new Set<string>();
    const deduped: typeof allPlacements = [];
    for (const p of allPlacements) {
      const compositeCampaign = (typeof p.campaign_id === 'number'
        ? String(p.campaign_id)
        : ((p as any).campaign_mongo_id ? String((p as any).campaign_mongo_id) : ''));
      const zoneKey = (typeof p.zone_id === 'number' ? String(p.zone_id) : (p as any).zone_mongo_id || '');
      const key = `${compositeCampaign}-${p.advertisement_id}-${zoneKey}`;
      if (!seen.has(key)) { seen.add(key); deduped.push(p); }
    }
    
    // Build unique id sets for batch fetching
    const adIds = Array.from(new Set(deduped.map(p => p.advertisement_id)));
    const zoneIds = Array.from(new Set(deduped.map(p => p.zone_id).filter((v): v is number => typeof v === 'number')));
    const zoneMongoIds = Array.from(new Set(
      deduped
        .map((p: any) => p.zone_mongo_id)
        .filter((v): v is string => typeof v === 'string')
    ));
    const campaignIds = Array.from(new Set(deduped
      .map(p => (p as any).campaign_id)
      .filter((v): v is number => typeof v === 'number')));
    
    // Fetch related entities in batches
    const [ads, zones, localZones, campaignsById] = await Promise.all([
      Advertisement.find({ id: { $in: adIds } }).lean(),
      Zone.find({ id: { $in: zoneIds } }).lean(),
      (await import('@/lib/models/local-zone')).default.find({ _id: { $in: zoneMongoIds } }).lean(),
      Campaign.find({ id: { $in: campaignIds } }).lean(),
    ]);
    
    // Build lookup maps
    const adMap = new Map<number, any>(ads.map((a: any) => [a.id, a]));
    const zoneMap = new Map<number, any>(zones.map((z: any) => [z.id, z]));
    const zoneLocalMap = new Map<string, any>(localZones.map((z: any) => [z._id?.toString?.(), z]));
    const campaignMap = new Map<number, any>(campaignsById.map((c: any) => [c.id, c]));
    
    // Start filtered set
    let filtered = deduped;
    if (advertisementIdFilter) {
      const aid = parseInt(advertisementIdFilter);
      if (Number.isFinite(aid)) {
        filtered = filtered.filter(p => p.advertisement_id === aid);
      }
    }
    if (zoneIdFilter) {
      const zid = parseInt(zoneIdFilter);
      if (Number.isFinite(zid)) {
        filtered = filtered.filter(p => p.zone_id === zid);
      }
    }
    if (!hasAnyFilter && hardLimit > 0) {
      filtered = filtered.slice(0, hardLimit);
    }
    
    // Batch advertiser and network lookups
    const advertiserIds = Array.from(new Set(
      filtered.map(p => {
        const cid = typeof (p as any).campaign_id === 'number' ? (p as any).campaign_id : undefined;
        const c = cid != null ? campaignMap.get(cid) : undefined;
        return c ? (c as any).advertiser_id : (p as any)._localCampaign?.advertiser_id;
      }).filter((v): v is number => typeof v === 'number')
    ));
    const networkIds = Array.from(new Set(
      filtered.map((p: any) => {
        const fromSynced = typeof p.zone_id === 'number' ? zoneMap.get(p.zone_id)?.network_id : undefined;
        const fromLocal = p.zone_mongo_id ? zoneLocalMap.get(String(p.zone_mongo_id))?.network_id : undefined;
        return fromSynced ?? fromLocal;
      }).filter((v): v is number => typeof v === 'number')
    ));
    const [advertisers, networks] = await Promise.all([
      Advertiser.find({ id: { $in: advertiserIds } }).lean(),
      Network.find({ id: { $in: networkIds } }).lean(),
    ]);
    const advertiserMap = new Map<number, any>(advertisers.map((a: any) => [a.id, a]));
    const networkMap = new Map<number, any>(networks.map((n: any) => [n.id, n]));

    // Optional filter by networkId using all available maps (after maps are built)
    if (networkId) {
      const nid = parseInt(networkId);
      filtered = filtered.filter((p: any) => {
        const z = typeof p.zone_id === 'number' ? zoneMap.get(p.zone_id) : undefined;
        const zl = p.zone_mongo_id ? zoneLocalMap.get(String(p.zone_mongo_id)) : undefined;
        const c = typeof p.campaign_id === 'number' ? campaignMap.get(p.campaign_id) : undefined;
        const adv = c && typeof (c as any).advertiser_id === 'number' ? advertiserMap.get((c as any).advertiser_id) : undefined;
        const networkFromSynced = z?.network_id;
        const networkFromLocal = zl?.network_id;
        const networkFromCampaign = c?.network_id;
        const networkFromAdvertiser = adv?.network_id;
        return (
          (typeof networkFromSynced === 'number' && networkFromSynced === nid) ||
          (typeof networkFromLocal === 'number' && networkFromLocal === nid) ||
          (typeof networkFromCampaign === 'number' && networkFromCampaign === nid) ||
          (typeof networkFromAdvertiser === 'number' && networkFromAdvertiser === nid)
        );
      });
    }

    // Enrich using maps; handle local campaign enrichment
    const enrichedPlacements = filtered.map((placement: any) => {
      const advertisement = adMap.get(placement.advertisement_id);
      const zone = typeof placement.zone_id === 'number' ? zoneMap.get(placement.zone_id) : undefined;
      const zoneLocal = placement.zone_mongo_id ? zoneLocalMap.get(String(placement.zone_mongo_id)) : undefined;
      const campaign = campaignMap.get(placement.campaign_id);
      const local = placement._localCampaign;

      const advertiser = campaign
        ? advertiserMap.get(campaign.advertiser_id)
        : (local?.advertiser_id ? advertiserMap.get(local.advertiser_id) : null);

      const network = zone ? networkMap.get(zone.network_id) : null;

      return {
        ...placement,
        ...(placement.campaign_mongo_id ? { campaign_mongo_id: placement.campaign_mongo_id } : {}),
        advertisement: advertisement ? {
          broadstreet_id: (advertisement as any).id,
          mongo_id: (advertisement as any)._id?.toString?.(),
          // explicit naming
          broadstreet_advertisement_id: (advertisement as any).id,
          local_advertisement_id: (advertisement as any)._id?.toString?.(),
          name: (advertisement as any).name,
          type: (advertisement as any).type,
          preview_url: (advertisement as any).preview_url,
        } : null,
        campaign: local ? {
          ...(typeof local.broadstreet_id === 'number' ? { broadstreet_id: local.broadstreet_id } : {}),
          mongo_id: local.mongo_id,
          ...(typeof local.broadstreet_id === 'number' ? { broadstreet_campaign_id: local.broadstreet_id } : {}),
          local_campaign_id: local.mongo_id,
          name: local.name,
          start_date: local.start_date,
          end_date: local.end_date,
          active: local.active,
        } : (campaign ? {
          broadstreet_id: (campaign as any).id,
          mongo_id: (campaign as any)._id?.toString?.(),
          broadstreet_campaign_id: (campaign as any).id,
          local_campaign_id: (campaign as any)._id?.toString?.(),
          name: (campaign as any).name,
          start_date: (campaign as any).start_date,
          end_date: (campaign as any).end_date,
          active: (campaign as any).active,
        } : null),
        zone: zone ? {
          broadstreet_id: (zone as any).id,
          mongo_id: (zone as any)._id?.toString?.(),
          broadstreet_zone_id: (zone as any).id,
          local_zone_id: (zone as any)._id?.toString?.(),
          name: (zone as any).name,
          alias: (zone as any).alias,
          size_type: (zone as any).size_type,
          size_number: (zone as any).size_number,
        } : (zoneLocal ? {
          broadstreet_id: undefined,
          mongo_id: (zoneLocal as any)._id?.toString?.(),
          local_zone_id: (zoneLocal as any)._id?.toString?.(),
          name: (zoneLocal as any).name,
          alias: (zoneLocal as any).alias,
          size_type: (zoneLocal as any).size_type,
          size_number: (zoneLocal as any).size_number,
        } : null),
        advertiser: advertiser ? {
          broadstreet_id: (advertiser as any).id,
          mongo_id: (advertiser as any)._id?.toString?.(),
          broadstreet_advertiser_id: (advertiser as any).id,
          local_advertiser_id: (advertiser as any)._id?.toString?.(),
          name: (advertiser as any).name,
        } : null,
        network: network ? {
          broadstreet_id: (network as any).id,
          mongo_id: (network as any)._id?.toString?.(),
          broadstreet_network_id: (network as any).id,
          local_network_id: (network as any)._id?.toString?.(),
          name: (network as any).name,
        } : null,
      };
    });
    
    return NextResponse.json({
      success: true,
      count: enrichedPlacements.length,
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
