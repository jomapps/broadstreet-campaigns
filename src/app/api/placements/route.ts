import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Advertisement from '@/lib/models/advertisement';
import Campaign from '@/lib/models/campaign';
import Zone from '@/lib/models/zone';
import Advertiser from '@/lib/models/advertiser';
import Network from '@/lib/models/network';
import LocalCampaign from '@/lib/models/local-campaign';
import Placement from '@/lib/models/placement';

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

    // Fetch local placements from the dedicated collection
    const localPlacementQuery: Record<string, unknown> = {};
    if (networkId) localPlacementQuery.network_id = parseInt(networkId);
    if (advertiserId) localPlacementQuery.advertiser_id = parseInt(advertiserId);
    if (campaignId) localPlacementQuery.campaign_id = parseInt(campaignId);
    if (campaignMongoId) localPlacementQuery.campaign_mongo_id = campaignMongoId;
    if (advertisementIdFilter) localPlacementQuery.advertisement_id = parseInt(advertisementIdFilter);
    if (zoneIdFilter) localPlacementQuery.zone_id = parseInt(zoneIdFilter);

    const localPlacements = await Placement.find({
      ...localPlacementQuery,
      created_locally: true
    }).lean();

    // Debug logging
    console.log(`[Placements API] Network ID: ${networkId}`);
    console.log(`[Placements API] Campaign query:`, campaignQuery);
    console.log(`[Placements API] Found ${campaigns.length} synced campaigns`);
    console.log(`[Placements API] Local query:`, localQuery);
    console.log(`[Placements API] Found ${localCampaigns.length} local campaigns`);
    console.log(`[Placements API] Local placement query:`, localPlacementQuery);
    console.log(`[Placements API] Found ${localPlacements.length} local placements`);

    // Log campaign details
    campaigns.forEach((c: any, i) => {
      console.log(`[Placements API] Synced Campaign ${i}: ID=${c.id}, name="${c.name}", placements=${c.placements?.length || 0}`);
    });
    localCampaigns.forEach((c: any, i) => {
      console.log(`[Placements API] Local Campaign ${i}: ID=${c._id}, name="${c.name}", placements=${c.placements?.length || 0}`);
    });

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
        console.log(`[Placements API] Processing local campaign "${lc.name}" with ${lc.placements.length} placements`);
        for (const placement of lc.placements as any[]) {
          const numericId = (lc as any).original_broadstreet_id;
          const mongoId = (lc as any)._id.toString();
          const placementData = {
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
          };
          console.log(`[Placements API] Adding placement:`, placementData);
          allPlacements.push(placementData);
        }
      }
    }

    // From local placement collection
    for (const localPlacement of localPlacements) {
      console.log(`[Placements API] Processing local placement from collection:`, localPlacement);

      const placementData = {
        advertisement_id: (localPlacement as any).advertisement_id,
        zone_id: (localPlacement as any).zone_id,
        zone_mongo_id: (localPlacement as any).zone_mongo_id,
        restrictions: (localPlacement as any).restrictions,
        campaign_id: (localPlacement as any).campaign_id,
        campaign_mongo_id: (localPlacement as any).campaign_mongo_id,
        _isLocalCollection: true, // Flag to identify source
        _localPlacementId: (localPlacement as any)._id?.toString?.(),
        network_id: (localPlacement as any).network_id,
        advertiser_id: (localPlacement as any).advertiser_id,
      };

      console.log(`[Placements API] Adding local collection placement:`, placementData);
      allPlacements.push(placementData);
    }

    console.log(`[Placements API] Total placements collected: ${allPlacements.length}`);
    
    // Deduplicate across synced/local/collection to avoid duplicates. Prefer local collection over embedded.
    const seen = new Set<string>();
    const deduped: typeof allPlacements = [];

    // Sort to prioritize local collection placements over embedded ones
    const sortedPlacements = allPlacements.sort((a, b) => {
      if ((a as any)._isLocalCollection && !(b as any)._isLocalCollection) return -1;
      if (!(a as any)._isLocalCollection && (b as any)._isLocalCollection) return 1;
      return 0;
    });

    for (const p of sortedPlacements) {
      const compositeCampaign = (typeof p.campaign_id === 'number'
        ? String(p.campaign_id)
        : ((p as any).campaign_mongo_id ? String((p as any).campaign_mongo_id) : ''));
      const zoneKey = (typeof p.zone_id === 'number' ? String(p.zone_id) : (p as any).zone_mongo_id || '');
      const key = `${compositeCampaign}-${p.advertisement_id}-${zoneKey}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(p);
      } else if ((p as any)._isLocalCollection) {
        // If we have a duplicate but this is from local collection, replace the embedded one
        const existingIndex = deduped.findIndex(existing => {
          const existingCampaign = (typeof existing.campaign_id === 'number'
            ? String(existing.campaign_id)
            : ((existing as any).campaign_mongo_id ? String((existing as any).campaign_mongo_id) : ''));
          const existingZoneKey = (typeof existing.zone_id === 'number' ? String(existing.zone_id) : (existing as any).zone_mongo_id || '');
          const existingKey = `${existingCampaign}-${existing.advertisement_id}-${existingZoneKey}`;
          return existingKey === key;
        });
        if (existingIndex >= 0 && !(deduped[existingIndex] as any)._isLocalCollection) {
          deduped[existingIndex] = p; // Replace embedded with local collection
        }
      }
    }

    console.log(`[Placements API] After deduplication: ${deduped.length} placements`);
    
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
      Advertisement.find({ broadstreet_id: { $in: adIds } }).lean(),
      Zone.find({ id: { $in: zoneIds } }).lean(),
      (await import('@/lib/models/local-zone')).default.find({ _id: { $in: zoneMongoIds } }).lean(),
      Campaign.find({ id: { $in: campaignIds } }).lean(),
    ]);

    // Build lookup maps
    const adMap = new Map<number, any>(ads.map((a: any) => [a.broadstreet_id, a]));
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
      Advertiser.find({ broadstreet_id: { $in: advertiserIds } }).lean(),
      Network.find({ broadstreet_id: { $in: networkIds } }).lean(),
    ]);
    const advertiserMap = new Map<number, any>(advertisers.map((a: any) => [a.broadstreet_id, a]));
    const networkMap = new Map<number, any>(networks.map((n: any) => [n.broadstreet_id, n]));



    // Optional filter by networkId using all available maps (after maps are built)
    if (networkId) {
      const nid = parseInt(networkId);


      filtered = filtered.filter((p: any) => {
        const z = typeof p.zone_id === 'number' ? zoneMap.get(p.zone_id) : undefined;
        const zl = p.zone_mongo_id ? zoneLocalMap.get(String(p.zone_mongo_id)) : undefined;
        const c = typeof p.campaign_id === 'number' ? campaignMap.get(p.campaign_id) : undefined;
        const adv = c && typeof (c as any).advertiser_id === 'number' ? advertiserMap.get((c as any).advertiser_id) : undefined;

        // Get local campaign network if available
        const localCampaignNetwork = p._localCampaign?.network_id;

        // FIX: If local campaign has network_id undefined but we're filtering by network_id,
        // and the campaign was found by network_id query, then it should match
        if (p._localCampaign && p._localCampaign.network_id === undefined && networkId) {
          p._localCampaign.network_id = parseInt(networkId);
        }

        // For local collection placements, use the direct network_id
        const networkFromLocalCollection = p._isLocalCollection ? p.network_id : undefined;

        const networkFromSynced = z?.network_id;
        const networkFromLocal = zl?.network_id;
        const networkFromCampaign = c?.network_id;
        const networkFromAdvertiser = adv?.network_id;
        // Use the corrected network_id from local campaign
        const correctedLocalCampaignNetwork = p._localCampaign?.network_id;
        const networkFromLocalCampaign = typeof correctedLocalCampaignNetwork === 'number' ? correctedLocalCampaignNetwork : undefined;

        return (
          (typeof networkFromSynced === 'number' && networkFromSynced === nid) ||
          (typeof networkFromLocal === 'number' && networkFromLocal === nid) ||
          (typeof networkFromCampaign === 'number' && networkFromCampaign === nid) ||
          (typeof networkFromAdvertiser === 'number' && networkFromAdvertiser === nid) ||
          (typeof networkFromLocalCampaign === 'number' && networkFromLocalCampaign === nid) ||
          (typeof networkFromLocalCollection === 'number' && networkFromLocalCollection === nid)
        );
      });
    }

    // Enrich using maps; handle local campaign and local collection enrichment
    const enrichedPlacements = filtered.map((placement: any) => {
      const advertisement = adMap.get(placement.advertisement_id);
      const zone = typeof placement.zone_id === 'number' ? zoneMap.get(placement.zone_id) : undefined;
      const zoneLocal = placement.zone_mongo_id ? zoneLocalMap.get(String(placement.zone_mongo_id)) : undefined;
      const campaign = campaignMap.get(placement.campaign_id);
      const local = placement._localCampaign;

      // For local collection placements, get advertiser directly from the placement
      const advertiser = placement._isLocalCollection && placement.advertiser_id
        ? advertiserMap.get(placement.advertiser_id)
        : (campaign
          ? advertiserMap.get(campaign.advertiser_id)
          : (local?.advertiser_id ? advertiserMap.get(local.advertiser_id) : null));

      // For local collection placements, get network directly from the placement
      const network = placement._isLocalCollection && placement.network_id
        ? networkMap.get(placement.network_id)
        : (zone ? networkMap.get(zone.network_id) : null);

      return {
        ...placement,
        ...(placement.campaign_mongo_id ? { campaign_mongo_id: placement.campaign_mongo_id } : {}),
        // Source identification
        source: placement._isLocalCollection ? 'local_collection' : (placement._localCampaign ? 'local_embedded' : 'synced_embedded'),
        ...(placement._localPlacementId ? { local_placement_id: placement._localPlacementId } : {}),
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

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { campaign_mongo_id, advertisement_id, zone_id, zone_mongo_id } = body;

    if (!campaign_mongo_id || !advertisement_id) {
      return NextResponse.json(
        { error: 'campaign_mongo_id and advertisement_id are required' },
        { status: 400 }
      );
    }

    // Build the placement filter
    const placementFilter: any = { advertisement_id };

    if (zone_id !== undefined) {
      placementFilter.zone_id = zone_id;
    }

    if (zone_mongo_id) {
      placementFilter.zone_mongo_id = zone_mongo_id;
    }

    // Remove the placement from the campaign
    const result = await LocalCampaign.updateOne(
      { _id: campaign_mongo_id },
      { $pull: { placements: placementFilter } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Placement deleted successfully',
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Error deleting placement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
