import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Network from '@/lib/models/network';
import Advertiser from '@/lib/models/advertiser';
import Zone from '@/lib/models/zone';
import Campaign from '@/lib/models/campaign';
import Advertisement from '@/lib/models/advertisement';
import broadstreetAPI from '@/lib/broadstreet-api';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json().catch(() => ({}));
    const networkIdRaw = body?.networkId;
    const networkId = typeof networkIdRaw === 'string' ? parseInt(networkIdRaw, 10) : networkIdRaw;

    if (typeof networkId !== 'number' || Number.isNaN(networkId)) {
      return NextResponse.json({ success: false, message: 'networkId (number) required in body' }, { status: 400 });
    }

    // Verify network exists locally (optional sanity check)
    const network = await Network.findOne({ broadstreet_id: networkId }).lean();
    if (!network) {
      // Still proceed; remote may exist even if local missing
      console.warn(`[sync/network] Proceeding without local network record for ${networkId}`);
    }

    // 1) Delete all non-local data scoped to this network
    //    We treat non-local as main collections (synced with API). Local collections are not touched here.
    const [advDel, zoneDel, campDel, adDel] = await Promise.all([
      Advertiser.deleteMany({ network_id: networkId }),
      Zone.deleteMany({ network_id: networkId }),
      Campaign.deleteMany({ network_id: networkId }),
      Advertisement.deleteMany({ network_id: networkId }),
    ]);

    // 2) Pull fresh data from Broadstreet scoped to this network
    const [remoteAdvertisers, remoteZones, remoteCampaigns, remoteAds] = await Promise.all([
      broadstreetAPI.getAdvertisers(networkId).catch(() => []),
      broadstreetAPI.getZones(networkId).catch(() => []),
      // Campaigns require advertiser context; fetch per advertiser
      (async () => {
        try {
          const advertisers = await broadstreetAPI.getAdvertisers(networkId);
          const all: any[] = [];
          for (const a of advertisers) {
            const aid = (a as any).broadstreet_id ?? (a as any).id;
            if (typeof aid === 'number') {
              const campaigns = await broadstreetAPI.getCampaignsByAdvertiser(aid);
              all.push(...campaigns.map(c => ({ ...c, network_id: networkId })));
            }
          }
          return all;
        } catch {
          return [];
        }
      })(),
      broadstreetAPI.getAdvertisements({ networkId }).catch(() => []),
    ]);

    // 3) Insert fresh copies with normalized IDs
    //    Drop any legacy unique index on `id` to avoid dup key on null
    try {
      const indexes = await Advertiser.collection.indexes();
      const legacy = indexes.find((i: any) => i.name === 'id_1');
      if (legacy) {
        await Advertiser.collection.dropIndex('id_1');
      }
    } catch (_) {}
    const advertiserDocs = (remoteAdvertisers as any[]).map((a) => ({
      broadstreet_id: (a as any).broadstreet_id ?? (a as any).id,
      name: (a as any).name,
      logo: (a as any).logo,
      web_home_url: (a as any).web_home_url,
      notes: (a as any).notes,
      admins: (a as any).admins,
      network_id: networkId,
    }));

    const zoneDocs = (remoteZones as any[]).map((z) => ({
      broadstreet_id: (z as any).broadstreet_id ?? (z as any).id,
      name: (z as any).name,
      network_id: networkId,
      alias: (z as any).alias,
      self_serve: (z as any).self_serve,
    }));

    const campaignDocs = (remoteCampaigns as any[]).map((c) => ({
      broadstreet_id: (c as any).broadstreet_id ?? (c as any).id,
      name: (c as any).name,
      advertiser_id: (c as any).advertiser_id,
      start_date: (c as any).start_date,
      end_date: (c as any).end_date,
      max_impression_count: (c as any).max_impression_count,
      display_type: (c as any).display_type,
      active: (c as any).active,
      weight: (c as any).weight,
      path: (c as any).path,
      archived: (c as any).archived,
      pacing_type: (c as any).pacing_type,
      impression_max_type: (c as any).impression_max_type,
      paused: (c as any).paused,
      notes: (c as any).notes,
      network_id: networkId,
    }));

    // Fetch placements for each campaign and embed
    if (campaignDocs.length > 0) {
      try {
        const placedMap = new Map<number, any[]>();
        for (const c of campaignDocs) {
          const cid = c.broadstreet_id as number;
          const placements = await broadstreetAPI.getPlacements(cid).catch(() => []);
          placedMap.set(cid, placements);
        }
        // Assign embedded placements
        campaignDocs.forEach((c) => {
          const p = placedMap.get(c.broadstreet_id) || [];
          // Standardize to schema field names expected by ICampaign
          (c as any).placements = p.map((pl: any) => ({
            advertisement_id: (pl as any).advertisement_id ?? (pl as any).advertisement_broadstreet_id,
            zone_id: (pl as any).zone_id ?? (pl as any).zone_broadstreet_id,
            restrictions: (pl as any).restrictions || [],
          }));
        });
      } catch (_) {}
    }

    const adDocs = (remoteAds as any[]).map((a) => ({
      broadstreet_id: (a as any).broadstreet_id ?? (a as any).id,
      name: (a as any).name,
      updated_at: (a as any).updated_at,
      type: (a as any).type,
      advertiser: (a as any).advertiser,
      active: (a as any).active,
      active_placement: (a as any).active_placement,
      preview_url: (a as any).preview_url,
      network_id: networkId,
    }));

    // Drop legacy unique indexes on `id` where present to avoid dup key on null
    try {
      const [zIdx, cIdx, aIdx] = await Promise.all([
        Zone.collection.indexes().catch(() => []),
        Campaign.collection.indexes().catch(() => []),
        Advertisement.collection.indexes().catch(() => []),
      ]);
      if (Array.isArray(zIdx) && zIdx.find((i: any) => i.name === 'id_1')) {
        await Zone.collection.dropIndex('id_1');
      }
      if (Array.isArray(cIdx) && cIdx.find((i: any) => i.name === 'id_1')) {
        await Campaign.collection.dropIndex('id_1');
      }
      if (Array.isArray(aIdx) && aIdx.find((i: any) => i.name === 'id_1')) {
        await Advertisement.collection.dropIndex('id_1');
      }
    } catch (_) {}

    // Bulk insert with duplicate handling
    if (advertiserDocs.length) await Advertiser.insertMany(advertiserDocs, { ordered: false }).catch(() => {});
    if (zoneDocs.length) await Zone.insertMany(zoneDocs, { ordered: false }).catch(() => {});
    if (campaignDocs.length) await Campaign.insertMany(campaignDocs, { ordered: false }).catch(() => {});
    if (adDocs.length) await Advertisement.insertMany(adDocs, { ordered: false }).catch(() => {});

    return NextResponse.json({
      success: true,
      deleted: {
        advertisers: advDel.deletedCount || 0,
        zones: zoneDel.deletedCount || 0,
        campaigns: campDel.deletedCount || 0,
        advertisements: adDel.deletedCount || 0,
      },
      inserted: {
        advertisers: advertiserDocs.length,
        zones: zoneDocs.length,
        campaigns: campaignDocs.length,
        advertisements: adDocs.length,
      },
    });
  } catch (error) {
    console.error('[sync/network] error', error);
    return NextResponse.json({ success: false, message: 'Sync failed', error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}


