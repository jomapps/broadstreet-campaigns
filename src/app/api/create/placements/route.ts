import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LocalCampaign from '@/lib/models/local-campaign';
import Campaign from '@/lib/models/campaign';

type RequestBody = {
  campaign_id?: number;
  campaign_mongo_id?: string;
  advertisement_ids: Array<number | string>;
  zone_ids: Array<number | string>;
  restrictions?: string[];
};

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = (await request.json()) as RequestBody;
    const { campaign_id, campaign_mongo_id, advertisement_ids, zone_ids, restrictions } = body || ({} as RequestBody);

    // Validate required fields
    if (
      (!campaign_mongo_id && typeof campaign_id !== 'number') ||
      !Array.isArray(advertisement_ids) || advertisement_ids.length === 0 ||
      !Array.isArray(zone_ids) || zone_ids.length === 0
    ) {
      return NextResponse.json(
        { message: 'campaign_mongo_id OR campaign_id, plus advertisement_ids[] and zone_ids[] are required' },
        { status: 400 }
      );
    }

    // Find or create a local campaign by _id (for locally created) or by original_broadstreet_id (for synced mirror)
    let campaign = campaign_mongo_id
      ? await LocalCampaign.findById(campaign_mongo_id).lean()
      : await LocalCampaign.findOne({ original_broadstreet_id: campaign_id }).lean();

    // If not found and we have a numeric campaign_id, upsert a mirror from Campaign
    if (!campaign && typeof campaign_id === 'number') {
      const source = await Campaign.findOne({ id: campaign_id }).lean();
      if (!source) {
        return NextResponse.json(
          { message: 'Source campaign not found to mirror locally' },
          { status: 404 }
        );
      }
      const mirror = await LocalCampaign.create({
        name: (source as any).name,
        network_id: (source as any).network_id,
        advertiser_id: (source as any).advertiser_id,
        start_date: (source as any).start_date,
        end_date: (source as any).end_date,
        max_impression_count: (source as any).max_impression_count,
        display_type: (source as any).display_type,
        active: (source as any).active,
        weight: (source as any).weight,
        path: (source as any).path,
        archived: (source as any).archived,
        pacing_type: (source as any).pacing_type,
        impression_max_type: (source as any).impression_max_type,
        paused: (source as any).paused,
        notes: (source as any).notes,
        placements: [],
        created_locally: false,
        synced_with_api: false,
        original_broadstreet_id: campaign_id,
        sync_errors: [],
      });
      campaign = (await LocalCampaign.findById(mirror._id).lean()) as any;
    }

    if (!campaign) {
      return NextResponse.json(
        { message: 'Local campaign not found for the provided campaign_id' },
        { status: 404 }
      );
    }

    // Normalize ids to numbers if strings were sent
    const normalizedAdIds = advertisement_ids.map((v) => (typeof v === 'string' ? parseInt(v, 10) : v)).filter((v) => Number.isFinite(v)) as number[];
    const normalizedZoneIds = zone_ids.map((v) => (typeof v === 'string' ? parseInt(v, 10) : v)).filter((v) => Number.isFinite(v)) as number[];

    // Build combinations (Cartesian product)
    const combinations = [] as Array<{ advertisement_id: number; zone_id: number; restrictions?: string[] }>;
    for (const adId of normalizedAdIds) {
      for (const zoneId of normalizedZoneIds) {
        combinations.push({ advertisement_id: adId, zone_id: zoneId, restrictions });
      }
    }

    // Compute existing and toInsert for accurate created count and dedupe by ad+zone regardless of restrictions
    // CURRENT BEHAVIOR: If a placement already exists (same ad+zone), restrictions are NOT updated
    // This prevents accidental overwrites but may require manual cleanup if restrictions need to change
    const before = (await LocalCampaign.findById(campaign._id).lean())?.placements ?? [];
    const existingKeys = new Set(before.map((p: any) => `${p.advertisement_id}-${p.zone_id}`));
    const toInsert = combinations
      .filter((c) => !existingKeys.has(`${c.advertisement_id}-${c.zone_id}`))
      .map((c) => ({
        advertisement_id: c.advertisement_id,
        zone_id: c.zone_id,
        ...(c.restrictions && c.restrictions.length > 0 ? { restrictions: c.restrictions } : {}),
      }));

    if (toInsert.length > 0) {
      await LocalCampaign.updateOne(
        { _id: campaign._id },
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


