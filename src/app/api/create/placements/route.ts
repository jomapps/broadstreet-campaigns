import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LocalCampaign from '@/lib/models/local-campaign';
import Campaign from '@/lib/models/campaign';
import Advertiser from '@/lib/models/advertiser';
import Zone from '@/lib/models/zone';
import { resolveCampaignBroadstreetId, resolveZoneBroadstreetId } from '@/lib/utils/sync-helpers';

type RequestBody = {
  campaign_broadstreet_id?: number;
  campaign_mongo_id?: string;
  advertisement_ids: Array<number | string>;
  zone_ids: Array<number | string>;
  restrictions?: string[];
};

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = (await request.json()) as RequestBody;
    const { campaign_broadstreet_id, campaign_mongo_id, advertisement_ids, zone_ids, restrictions } = body || ({} as RequestBody);

    // Validate required fields
    if (
      (!campaign_mongo_id && typeof campaign_broadstreet_id !== 'number') ||
      !Array.isArray(advertisement_ids) || advertisement_ids.length === 0 ||
      !Array.isArray(zone_ids) || zone_ids.length === 0
    ) {
      return NextResponse.json(
        { message: 'campaign_mongo_id OR campaign_broadstreet_id, plus advertisement_ids[] and zone_ids[] are required' },
        { status: 400 }
      );
    }

    // Strictly normalize ads to numeric Broadstreet IDs; zones can be numeric or Mongo IDs, convert later
    const toNum = (v: unknown) => typeof v === 'number' ? v : (typeof v === 'string' && /^\d+$/.test(v) ? parseInt(v, 10) : NaN);
    const normalizedAdIdsAll = Array.isArray(advertisement_ids) ? advertisement_ids.map(toNum) : [];
    const normalizedAdIds = normalizedAdIdsAll.filter((v) => Number.isFinite(v)) as number[];
    if (normalizedAdIds.length !== normalizedAdIdsAll.length) {
      return NextResponse.json(
        { message: 'advertisement_ids must be numbers or numeric strings' },
        { status: 400 }
      );
    }

    // Find or create a local campaign by _id (for locally created) or by original_broadstreet_id (for synced mirror)
    let campaign = campaign_mongo_id
      ? await LocalCampaign.findById(campaign_mongo_id).lean()
      : await LocalCampaign.findOne({ original_broadstreet_id: campaign_broadstreet_id }).lean();

    // If not found and we have a numeric campaign_id, upsert a mirror from Campaign
    if (!campaign && typeof campaign_broadstreet_id === 'number') {
      const source = await Campaign.findOne({ id: campaign_broadstreet_id }).lean();
      if (!source) {
        return NextResponse.json(
          { message: 'Source campaign not found to mirror locally' },
          { status: 404 }
        );
      }
      // Ensure required LocalCampaign fields exist; derive network_id from Advertiser if missing
      const advertiser = (source as any).advertiser_id
        ? (await Advertiser.findOne({ id: (source as any).advertiser_id }).lean()) as any
        : null;
      let resolvedNetworkId = (source as any).network_id ?? (advertiser && typeof advertiser.network_id === 'number' ? advertiser.network_id : undefined);
      if (typeof resolvedNetworkId !== 'number') {
        // Fallback: derive network_id from the first selected zone
        const firstZoneIdRaw = Array.isArray(zone_ids) ? zone_ids[0] : undefined;
        if (firstZoneIdRaw != null) {
          let zoneDoc: any = null;
          const resolvedZoneId = await resolveZoneBroadstreetId(
            typeof firstZoneIdRaw === 'number' || (typeof firstZoneIdRaw === 'string' && /^\d+$/.test(firstZoneIdRaw))
              ? { broadstreet_id: typeof firstZoneIdRaw === 'number' ? firstZoneIdRaw : parseInt(firstZoneIdRaw, 10) }
              : { mongo_id: firstZoneIdRaw as string }
          );
          if (typeof resolvedZoneId !== 'number') {
            return NextResponse.json(
              { message: 'Unable to resolve numeric zone_id from provided zone_ids' },
              { status: 422 }
            );
          }
          zoneDoc = await Zone.findOne({ id: resolvedZoneId }).lean();
          if (zoneDoc && typeof zoneDoc.network_id === 'number') {
            resolvedNetworkId = zoneDoc.network_id;
          }
        }
        if (typeof resolvedNetworkId !== 'number') {
          return NextResponse.json(
            { message: 'Unable to determine network_id for mirrored campaign' },
            { status: 422 }
          );
        }
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
        original_broadstreet_id: campaign_broadstreet_id,
        sync_errors: [],
      });
      campaign = (await LocalCampaign.findById(mirror._id).lean()) as any;
    }

    // Edge case handling: if campaign_mongo_id was provided but does not match a LocalCampaign,
    // it might actually be a Mongo _id from the synced Campaign collection; try mirroring by that id.
    if (!campaign && campaign_mongo_id) {
      const sourceByMongo = await Campaign.findById(campaign_mongo_id).lean();
      if (sourceByMongo) {
        const advertiser = (sourceByMongo as any).advertiser_id
          ? (await Advertiser.findOne({ id: (sourceByMongo as any).advertiser_id }).lean()) as any
          : null;
        let resolvedNetworkId = (sourceByMongo as any).network_id ?? (advertiser && typeof advertiser.network_id === 'number' ? advertiser.network_id : undefined);
        if (typeof resolvedNetworkId !== 'number') {
          // Fallback: derive network_id from the first selected zone
          const firstZoneIdRaw = Array.isArray(zone_ids) ? zone_ids[0] : undefined;
          if (firstZoneIdRaw != null) {
            let zoneDoc: any = null;
            const resolvedZoneId = await resolveZoneBroadstreetId(
              typeof firstZoneIdRaw === 'number' || (typeof firstZoneIdRaw === 'string' && /^\d+$/.test(firstZoneIdRaw))
                ? { broadstreet_id: typeof firstZoneIdRaw === 'number' ? firstZoneIdRaw : parseInt(firstZoneIdRaw, 10) }
                : { mongo_id: firstZoneIdRaw as string }
            );
            if (typeof resolvedZoneId !== 'number') {
              return NextResponse.json(
                { message: 'Unable to resolve numeric zone_id from provided zone_ids' },
                { status: 422 }
              );
            }
            zoneDoc = await Zone.findOne({ id: resolvedZoneId }).lean();
            if (zoneDoc && typeof zoneDoc.network_id === 'number') {
              resolvedNetworkId = zoneDoc.network_id;
            }
          }
          if (typeof resolvedNetworkId !== 'number') {
            return NextResponse.json(
              { message: 'Unable to determine network_id for mirrored campaign' },
              { status: 422 }
            );
          }
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
          original_broadstreet_id: (sourceByMongo as any).id,
          sync_errors: [],
        });
        campaign = (await LocalCampaign.findById(mirror._id).lean()) as any;
      }
    }

    if (!campaign) {
      return NextResponse.json(
        { message: 'Local campaign not found for the provided campaign_id' },
        { status: 404 }
      );
    }

    // Resolve zones: allow numeric Broadstreet IDs or Mongo IDs; store appropriately
    const resolvedZoneIds: number[] = [];
    const resolvedZoneMongoIds: string[] = [];
    for (const zid of zone_ids) {
      if (typeof zid === 'number' || (typeof zid === 'string' && /^\d+$/.test(zid))) {
        const asNum = typeof zid === 'number' ? zid : parseInt(zid, 10);
        resolvedZoneIds.push(asNum);
      } else if (typeof zid === 'string') {
        resolvedZoneMongoIds.push(zid);
      }
    }

    // Build combinations (Cartesian product)
    const combinations = [] as Array<{ advertisement_id: number; zone_id: number; zone_mongo_id?: string; restrictions?: string[] }>;
    for (const adId of normalizedAdIds) {
      // Numeric zones
      for (const zoneId of resolvedZoneIds) {
        combinations.push({ advertisement_id: adId, zone_id: zoneId, restrictions });
      }
      // Local zones referenced by mongo id
      for (const zoneMongoId of resolvedZoneMongoIds) {
        combinations.push({ advertisement_id: adId, zone_id: NaN as any, zone_mongo_id: zoneMongoId, restrictions });
      }
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


