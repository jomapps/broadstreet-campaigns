import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import LocalCampaign from '@/lib/models/local-campaign';
import Campaign from '@/lib/models/campaign';
import Advertiser from '@/lib/models/advertiser';



type RequestBody = {
  campaignId?: number;
  campaignMongoId?: string;
  // New format: exact placement combinations
  placements?: Array<{
    advertisementId: number | string;
    zoneId: number | string;
  }>;
  // Legacy format: unique IDs (for backward compatibility)
  advertisementIds?: Array<number | string>;
  zoneIds?: Array<number | string>;
  restrictions?: string[];
};

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = (await request.json()) as RequestBody;
    const { campaignId, campaignMongoId, placements, advertisementIds, zoneIds, restrictions } = body || ({} as RequestBody);

    console.log('Placement creation request:', {
      campaignId,
      campaignMongoId,
      placementsCount: placements?.length,
      advertisementIdsCount: advertisementIds?.length,
      zoneIdsCount: zoneIds?.length,
      hasNewFormat: Array.isArray(placements) && placements.length > 0,
      hasLegacyFormat: Array.isArray(advertisementIds) && advertisementIds.length > 0 && Array.isArray(zoneIds) && zoneIds.length > 0
    });

    // Validate required fields - support both new and legacy formats
    const hasNewFormat = Array.isArray(placements) && placements.length > 0;
    const hasLegacyFormat = Array.isArray(advertisementIds) && advertisementIds.length > 0 &&
                           Array.isArray(zoneIds) && zoneIds.length > 0;

    if (
      (!campaignMongoId && typeof campaignId !== 'number') ||
      (!hasNewFormat && !hasLegacyFormat)
    ) {
      return NextResponse.json(
        { message: 'campaignMongoId OR campaignId, plus either placements[] or (advertisementIds[] and zoneIds[]) are required' },
        { status: 400 }
      );
    }

    // Build combinations based on format
    let combinations: Array<{ advertisement_id: number; zone_id: number; zone_mongo_id?: string; restrictions?: string[] }> = [];

    if (hasNewFormat && placements) {
      // New format: use exact placement combinations
      const toNum = (v: unknown) => typeof v === 'number' ? v : (typeof v === 'string' && /^\d+$/.test(v) ? parseInt(v, 10) : NaN);

      for (const placement of placements) {
        const adId = toNum(placement.advertisementId);
        if (!Number.isFinite(adId)) {
          return NextResponse.json(
            { message: 'All advertisementIds must be numbers or numeric strings' },
            { status: 400 }
          );
        }

        const zoneId = placement.zoneId;
        if (typeof zoneId === 'number' || (typeof zoneId === 'string' && /^\d+$/.test(zoneId))) {
          const asNum = typeof zoneId === 'number' ? zoneId : parseInt(zoneId, 10);
          combinations.push({ advertisement_id: adId, zone_id: asNum, restrictions });
        } else if (typeof zoneId === 'string') {
          combinations.push({ advertisement_id: adId, zone_id: NaN as any, zone_mongo_id: zoneId, restrictions });
        } else {
          return NextResponse.json(
            { message: 'All zoneIds must be numbers, numeric strings, or MongoDB ObjectId strings' },
            { status: 400 }
          );
        }
      }
    } else {
      // Legacy format: create Cartesian product
      const toNum = (v: unknown) => typeof v === 'number' ? v : (typeof v === 'string' && /^\d+$/.test(v) ? parseInt(v, 10) : NaN);
      const normalizedAdIdsAll = Array.isArray(advertisementIds) ? advertisementIds.map(toNum) : [];
      const normalizedAdIds = normalizedAdIdsAll.filter((v) => Number.isFinite(v)) as number[];
      if (normalizedAdIds.length !== normalizedAdIdsAll.length) {
        return NextResponse.json(
          { message: 'advertisementIds must be numbers or numeric strings' },
          { status: 400 }
        );
      }

      // Resolve zones: allow numeric Broadstreet IDs or Mongo IDs; store appropriately
      const resolvedZoneIds: number[] = [];
      const resolvedZoneMongoIds: string[] = [];
      for (const zid of zoneIds!) {
        if (typeof zid === 'number' || (typeof zid === 'string' && /^\d+$/.test(zid))) {
          const asNum = typeof zid === 'number' ? zid : parseInt(zid, 10);
          resolvedZoneIds.push(asNum);
        } else if (typeof zid === 'string') {
          resolvedZoneMongoIds.push(zid);
        }
      }

      // Build combinations (Cartesian product)
      for (const adId of normalizedAdIds) {
        // Numeric zones
        for (const zoneId of resolvedZoneIds) {
          combinations.push({ advertisement_id: adId, zone_id: zoneId, restrictions });
        }
        // Local zones referenced by mongo_id
        for (const zoneMongoId of resolvedZoneMongoIds) {
          combinations.push({ advertisement_id: adId, zone_id: NaN as any, zone_mongo_id: zoneMongoId, restrictions });
        }
      }
    }

    console.log('Built combinations count:', combinations.length);
    console.log('Using format:', hasNewFormat ? 'new (exact placements)' : 'legacy (cartesian product)');

    // Find or create a local campaign by _id (for locally created) or by original_broadstreet_id (for synced mirror)
    console.log('Looking for campaign with mongo_id:', campaignMongoId);
    console.log('Looking for campaign with broadstreet_id:', campaignId);

    // Validate MongoDB ObjectId format if provided
    if (campaignMongoId && !mongoose.Types.ObjectId.isValid(campaignMongoId)) {
      console.log('Invalid MongoDB ObjectId format:', campaignMongoId);
      return NextResponse.json(
        { message: 'Invalid campaign MongoDB ID format' },
        { status: 400 }
      );
    }

    let campaign: any = campaignMongoId
      ? await LocalCampaign.findById(campaignMongoId).lean()
      : await LocalCampaign.findOne({ original_broadstreet_id: campaignId }).lean();

    console.log('Found campaign in LocalCampaign:', !!campaign);



    // If not found in LocalCampaign and we have a mongo_id, try to find in regular Campaign collection
    if (!campaign && campaignMongoId) {
      console.log('Searching for campaign in main Campaign collection...');
      const sourceCampaign = await Campaign.findById(campaignMongoId).lean();
      console.log('Found campaign in main Campaign collection:', !!sourceCampaign);

      if (sourceCampaign) {
        console.log('Campaign data:', {
          name: (sourceCampaign as any).name,
          broadstreet_id: (sourceCampaign as any).broadstreet_id,
          advertiser_id: (sourceCampaign as any).advertiser_id,
          network_id: (sourceCampaign as any).network_id
        });

        // Mirror the campaign to LocalCampaign for placement storage
        const advertiser = (sourceCampaign as any).advertiser_id
          ? (await Advertiser.findOne({ broadstreet_id: (sourceCampaign as any).advertiser_id }).lean()) as any
          : null;
        console.log('Found advertiser for network resolution:', !!advertiser);

        const resolvedNetworkId = (sourceCampaign as any).network_id ?? (advertiser && typeof advertiser.network_id === 'number' ? advertiser.network_id : undefined);
        console.log('Resolved network_id:', resolvedNetworkId);



        if (typeof resolvedNetworkId !== 'number') {
          console.log('Failed to resolve network_id. Source network_id:', (sourceCampaign as any).network_id, 'Advertiser network_id:', advertiser?.network_id);
          return NextResponse.json(
            { message: 'Unable to resolve network_id for campaign mirroring' },
            { status: 422 }
          );
        }

        try {
          // Create LocalCampaign mirror
          const localCampaignData = {
            ...sourceCampaign,
            network_id: resolvedNetworkId,
            original_broadstreet_id: (sourceCampaign as any).broadstreet_id,
            created_locally: false,
            synced_with_api: true,
            placements: [],
          };
          delete (localCampaignData as any)._id;
          delete (localCampaignData as any).broadstreet_id;

          console.log('Creating LocalCampaign mirror with data:', {
            name: (localCampaignData as any).name,
            network_id: localCampaignData.network_id,
            original_broadstreet_id: localCampaignData.original_broadstreet_id
          });

          campaign = await LocalCampaign.create(localCampaignData);
          console.log('Successfully created LocalCampaign mirror with _id:', campaign._id);
        } catch (createError) {
          console.error('Error creating LocalCampaign mirror:', createError);
          return NextResponse.json(
            { message: 'Failed to create campaign mirror: ' + (createError as Error).message },
            { status: 500 }
          );
        }
      }
    }

    // If still not found and we have a numeric campaign_id, upsert a mirror from Campaign
    if (!campaign && typeof campaignId === 'number') {
      const source = await Campaign.findOne({ broadstreet_id: campaignId }).lean();
      if (!source) {
        return NextResponse.json(
          { message: 'Source campaign not found to mirror locally' },
          { status: 404 }
        );
      }
      // Ensure required LocalCampaign fields exist; derive network_id from Advertiser if missing
      const advertiser = (source as any).advertiser_id
        ? (await Advertiser.findOne({ broadstreet_id: (source as any).advertiser_id }).lean()) as any
        : null;
      const resolvedNetworkId = (source as any).network_id ?? (advertiser && typeof advertiser.network_id === 'number' ? advertiser.network_id : undefined);
      if (typeof resolvedNetworkId !== 'number') {
        return NextResponse.json(
          { message: 'Unable to determine network_id for mirrored campaign' },
          { status: 422 }
        );
      }
      if (typeof (source as any).advertiser_id !== 'number') {
        return NextResponse.json(
          { message: 'Unable to determine advertiser_id for mirrored campaign' },
          { status: 422 }
        );
      }
      const mirror = await LocalCampaign.create({
        name: (source as any).name,
        network_id: resolvedNetworkId,
        advertiser_id: (source as any).advertiser_id,
        start_date: (source as any).start_date ?? new Date().toISOString().slice(0, 10),
        end_date: (source as any).end_date,
        max_impression_count: (source as any).max_impression_count,
        display_type: (source as any).display_type,
        active: (source as any).active ?? true,
        weight: typeof (source as any).weight === 'number' ? (source as any).weight : 0,
        path: (source as any).path,
        archived: (source as any).archived,
        pacing_type: (source as any).pacing_type,
        impression_max_type: (source as any).impression_max_type,
        paused: (source as any).paused,
        notes: (source as any).notes,
        placements: [],
        created_locally: false,
        synced_with_api: false,
        original_broadstreet_id: campaignId,
        sync_errors: [],
      });
      campaign = (await LocalCampaign.findById(mirror._id).lean()) as any;
    }

    // Edge case handling: if campaign_mongo_id was provided but does not match a LocalCampaign,
    // it might actually be a Mongo _id from the synced Campaign collection; try mirroring by that _id.
    if (!campaign && campaignMongoId) {
      const sourceByMongo = await Campaign.findById(campaignMongoId).lean();
      if (sourceByMongo) {
        const advertiser = (sourceByMongo as any).advertiser_id
          ? (await Advertiser.findOne({ broadstreet_id: (sourceByMongo as any).advertiser_id }).lean()) as any
          : null;
        const resolvedNetworkId = (sourceByMongo as any).network_id ?? (advertiser && typeof advertiser.network_id === 'number' ? advertiser.network_id : undefined);
        if (typeof resolvedNetworkId !== 'number') {
          return NextResponse.json(
            { message: 'Unable to determine network_id for mirrored campaign' },
            { status: 422 }
          );
        }
        if (typeof (sourceByMongo as any).advertiser_id !== 'number') {
          return NextResponse.json(
            { message: 'Unable to determine advertiser_id for mirrored campaign' },
            { status: 422 }
          );
        }
        const mirror = await LocalCampaign.create({
          name: (sourceByMongo as any).name,
          network_id: resolvedNetworkId,
          advertiser_id: (sourceByMongo as any).advertiser_id,
          start_date: (sourceByMongo as any).start_date ?? new Date().toISOString().slice(0, 10),
          end_date: (sourceByMongo as any).end_date,
          max_impression_count: (sourceByMongo as any).max_impression_count,
          display_type: (sourceByMongo as any).display_type,
          active: (sourceByMongo as any).active ?? true,
          weight: typeof (sourceByMongo as any).weight === 'number' ? (sourceByMongo as any).weight : 0,
          path: (sourceByMongo as any).path,
          archived: (sourceByMongo as any).archived,
          pacing_type: (sourceByMongo as any).pacing_type,
          impression_max_type: (sourceByMongo as any).impression_max_type,
          paused: (sourceByMongo as any).paused,
          notes: (sourceByMongo as any).notes,
          placements: [],
          created_locally: false,
          synced_with_api: false,
          original_broadstreet_id: (sourceByMongo as any).broadstreet_id,
          sync_errors: [],
        });
        campaign = (await LocalCampaign.findById(mirror._id).lean()) as any;
      }
    }

    if (!campaign) {
      return NextResponse.json(
        { message: 'Local campaign not found for the provided campaign reference' },
        { status: 404 }
      );
    }



    // Compute existing and toInsert for accurate created count and dedupe by ad+zone regardless of restrictions
    // CURRENT BEHAVIOR: If a placement already exists (same ad+zone), restrictions are NOT updated
    // This prevents accidental overwrites but may require manual cleanup if restrictions need to change
    const beforeDoc = await LocalCampaign.findById((campaign as any)._id).lean();
    const before: any[] = (beforeDoc as any)?.placements ?? [];
    const existingKeys = new Set(before.map((p: any) => `${p.advertisement_id}-${p.zone_id || p.zone_mongo_id || ''}`));
    const toInsert = combinations
      .filter((c: any) => !existingKeys.has(`${c.advertisement_id}-${Number.isFinite(c.zone_id) ? c.zone_id : (c.zone_mongo_id || '')}`))
      .map((c: any) => ({
        advertisement_id: c.advertisement_id,
        ...(Number.isFinite(c.zone_id) ? { zone_id: c.zone_id } : {}),
        ...(!Number.isFinite(c.zone_id) && typeof c.zone_mongo_id === 'string' ? { zone_mongo_id: c.zone_mongo_id } : {}),
        ...(c.restrictions && c.restrictions.length > 0 ? { restrictions: c.restrictions } : {}),
      }));

    if (toInsert.length > 0) {
      await LocalCampaign.updateOne(
        { _id: (campaign as any)._id },
        { $addToSet: { placements: { $each: toInsert } } }
      );
    }

    const createdCount = toInsert.length;
    return NextResponse.json(
      { message: 'Placements created', created: createdCount, total: before.length + createdCount },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating placements:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}


