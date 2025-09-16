import connectDB from '../mongodb';
import broadstreetAPI from '../broadstreet-api';
import { parseZoneName } from './zone-parser';
import { cleanupLegacyIndexes, resolveBroadstreetId } from './entity-helpers';

// Import models
import Network from '../models/network';
import Advertiser from '../models/advertiser';
import Zone from '../models/zone';
import Campaign from '../models/campaign';
import Advertisement from '../models/advertisement';
import SyncLog from '../models/sync-log';
import LocalAdvertiser from '../models/local-advertiser';
import LocalZone from '../models/local-zone';

export async function syncNetworks(): Promise<{ success: boolean; count: number; error?: string }> {
  const syncLog = new SyncLog({
    entity: 'networks',
    status: 'pending',
    startTime: new Date(),
  });

  try {
    await connectDB();
    await syncLog.save();

    const networks = await broadstreetAPI.getNetworks();
    
    // Upsert networks for idempotent sync
    await cleanupLegacyIndexes(Network);
    
    const networkDocs = networks.map(network => ({
      broadstreet_id: (network as any).broadstreet_id ?? (network as any).id,
      name: network.name,
      group_id: network.group_id,
      web_home_url: network.web_home_url,
      logo: network.logo,
      valet_active: network.valet_active,
      path: network.path,
      advertiser_count: network.advertiser_count,
      zone_count: network.zone_count,
    }));

    if (networkDocs.length) {
      await Network.bulkWrite(
        networkDocs.map((doc) => ({
          updateOne: {
            filter: { broadstreet_id: doc.broadstreet_id },
            update: { $set: doc },
            upsert: true,
          },
        }))
      );
    }

    // Update sync log
    syncLog.status = 'success';
    syncLog.recordCount = networks.length;
    syncLog.endTime = new Date();
    await syncLog.save();

    return { success: true, count: networks.length };
  } catch (error) {
    syncLog.status = 'error';
    syncLog.error = error instanceof Error ? error.message : 'Unknown error';
    syncLog.endTime = new Date();
    await syncLog.save();

    return { success: false, count: 0, error: syncLog.error };
  }
}

export async function syncAdvertisers(): Promise<{ success: boolean; count: number; error?: string }> {
  const syncLog = new SyncLog({
    entity: 'advertisers',
    status: 'pending',
    startTime: new Date(),
  });

  try {
    await connectDB();
    await syncLog.save();

    // Get all networks first
    const networks = await Network.find({});

    // Collect all unique advertisers
    const allAdvertisers = new Map<number, any>();

    for (const network of networks) {
      try {
        // Guard against invalid network identifiers
        if (typeof (network as any).broadstreet_id !== 'number') {
          continue;
        }

        const advertisers = await broadstreetAPI.getAdvertisers((network as any).broadstreet_id);
        
        advertisers.forEach(advertiser => {
          // Only add if we haven't seen this advertiser ID before
          const advBsId = (advertiser as any).broadstreet_id ?? (advertiser as any).id;
          if (!allAdvertisers.has(advBsId)) {
            allAdvertisers.set(advBsId, {
              broadstreet_id: advBsId,
              name: advertiser.name,
              logo: advertiser.logo,
              web_home_url: advertiser.web_home_url,
              notes: advertiser.notes,
              admins: advertiser.admins,
              // Persist network context so we can derive campaign network_id when needed
              network_id: (network as any).broadstreet_id,
            });
          }
        });
      } catch (error: any) {
        // Handle duplicate key errors gracefully - silently continue
        continue;
      }
    }

    // Upsert all unique advertisers
    const advertiserDocs = Array.from(allAdvertisers.values());
    if (advertiserDocs.length > 0) {
      await cleanupLegacyIndexes(Advertiser);

      await Advertiser.bulkWrite(
        advertiserDocs.map((doc) => ({
          updateOne: {
            filter: { broadstreet_id: doc.broadstreet_id },
            update: { $set: doc },
            upsert: true,
          },
        }))
      );
    }

    // Update sync log
    syncLog.status = 'success';
    syncLog.recordCount = advertiserDocs.length;
    syncLog.endTime = new Date();
    await syncLog.save();

    return { success: true, count: advertiserDocs.length };
  } catch (error) {
    syncLog.status = 'error';
    syncLog.error = error instanceof Error ? error.message : 'Unknown error';
    syncLog.endTime = new Date();
    await syncLog.save();

    return { success: false, count: 0, error: syncLog.error };
  }
}

export async function syncZones(): Promise<{ success: boolean; count: number; error?: string }> {
  const syncLog = new SyncLog({
    entity: 'zones',
    status: 'pending',
    startTime: new Date(),
  });

  try {
    await connectDB();
    await syncLog.save();

    // Get all networks first
    const networks = await Network.find({});

    // Collect all unique zones
    const allZones = new Map<number, any>();

    for (const network of networks) {
      try {
        // Guard invalid network identifiers
        if (typeof (network as any).broadstreet_id !== 'number') {
          console.warn(`[syncZones] Skipping network with invalid broadstreet_id:`, { _id: (network as any)._id?.toString?.(), broadstreet_id: (network as any).broadstreet_id });
          continue;
        }

        const zones = await broadstreetAPI.getZones((network as any).broadstreet_id);
        
        zones.forEach(zone => {
          // Only add if we haven't seen this zone ID before
          const zoneBsId = (zone as any).broadstreet_id ?? (zone as any).id;
          if (!allZones.has(zoneBsId)) {
            const parsed = parseZoneName(zone.name);
            allZones.set(zoneBsId, {
              broadstreet_id: zoneBsId,
              name: zone.name,
              network_id: (zone as any).network_id ?? (network as any).broadstreet_id,
              alias: zone.alias,
              self_serve: zone.self_serve,
              size_type: parsed.size_type,
              size_number: parsed.size_number,
              category: parsed.category,
              block: parsed.block,
              is_home: parsed.is_home,
            });
          }
        });
      } catch (error: any) {
        // Handle errors gracefully - silently continue
        continue;
      }
    }

    // Upsert all unique zones
    const zoneDocs = Array.from(allZones.values());
    if (zoneDocs.length > 0) {
      await cleanupLegacyIndexes(Zone);

      await Zone.bulkWrite(
        zoneDocs.map((doc) => ({
          updateOne: {
            filter: { broadstreet_id: doc.broadstreet_id },
            update: { $set: doc },
            upsert: true,
          },
        }))
      );
    }

    // Update sync log
    syncLog.status = 'success';
    syncLog.recordCount = zoneDocs.length;
    syncLog.endTime = new Date();
    await syncLog.save();

    return { success: true, count: zoneDocs.length };
  } catch (error) {
    syncLog.status = 'error';
    syncLog.error = error instanceof Error ? error.message : 'Unknown error';
    syncLog.endTime = new Date();
    await syncLog.save();

    return { success: false, count: 0, error: syncLog.error };
  }
}

export async function syncCampaigns(): Promise<{ success: boolean; count: number; error?: string }> {
  const syncLog = new SyncLog({
    entity: 'campaigns',
    status: 'pending',
    startTime: new Date(),
  });

  try {
    await connectDB();
    await syncLog.save();

    // Get all advertisers first
    const advertisers = await Advertiser.find({});

    // Collect all unique campaigns
    const allCampaigns = new Map<number, any>();

    for (const advertiser of advertisers) {
      try {
        const advBsId = (advertiser as any).broadstreet_id ?? (advertiser as any).id;
        if (typeof advBsId !== 'number') {
          continue;
        }

        const campaigns = await broadstreetAPI.getCampaignsByAdvertiser(advBsId);

        campaigns.forEach(campaign => {
          // Only add if we haven't seen this campaign ID before
          const campBsId = (campaign as any).broadstreet_id ?? (campaign as any).id;
          if (!allCampaigns.has(campBsId)) {
            // Preserve raw payload for round-trip safety
            const raw = campaign;

            // Normalize weight: Broadstreet may return strings like "default" or "remnant"
            const weightRaw = (campaign as unknown as Record<string, unknown>).weight as string | number | undefined;
            let weight: number | undefined;
            if (typeof weightRaw === 'number') {
              weight = weightRaw;
            } else if (typeof weightRaw === 'string') {
              const lower = weightRaw.toLowerCase();
              // map known strings to sane numeric defaults
              if (lower === 'default') weight = 50;
              else if (lower === 'remnant') weight = 10;
              else {
                const parsed = Number(weightRaw);
                weight = Number.isFinite(parsed) ? parsed : undefined;
              }
            }

            // Dates: keep raw and normalized (optional)
            const startDateRaw = (campaign as unknown as Record<string, unknown>).start_date as string | undefined;
            const endDateRaw = (campaign as unknown as Record<string, unknown>).end_date as string | undefined;

            // display_type: keep raw and normalized (optional)
            const displayTypeRaw = (campaign as unknown as Record<string, unknown>).display_type as string | undefined;
            const allowedDisplay = ['no_repeat', 'allow_repeat_campaign', 'allow_repeat_advertisement', 'force_repeat_campaign'] as const;
            const displayType = allowedDisplay.includes(displayTypeRaw as typeof allowedDisplay[number]) ? displayTypeRaw : undefined;

            allCampaigns.set(campBsId, {
              broadstreet_id: campBsId,
              name: campaign.name,
              advertiser_id: (campaign as any).advertiser_id ?? advBsId,
              start_date: startDateRaw,
              end_date: endDateRaw,
              max_impression_count: campaign.max_impression_count,
              display_type: displayType,
              active: campaign.active,
              weight,
              path: campaign.path,
              archived: campaign.archived,
              pacing_type: campaign.pacing_type,
              impression_max_type: campaign.impression_max_type,
              paused: campaign.paused,
              notes: campaign.notes,
              // raw preservation
              weight_raw: typeof weightRaw === 'string' ? weightRaw : undefined,
              display_type_raw: displayTypeRaw,
              start_date_raw: startDateRaw,
              end_date_raw: endDateRaw,
              raw,
            });
          }
        });
      } catch (error: any) {
        // Handle errors gracefully - silently continue
        continue;
      }
    }

    // Upsert all unique campaigns
    const campaignDocs = Array.from(allCampaigns.values());
    if (campaignDocs.length > 0) {
      await cleanupLegacyIndexes(Campaign);

      await Campaign.bulkWrite(
        campaignDocs.map((doc) => ({
          updateOne: {
            filter: { broadstreet_id: doc.broadstreet_id },
            update: { $set: doc },
            upsert: true,
          },
        }))
      );
    }

    // Update sync log
    syncLog.status = 'success';
    syncLog.recordCount = campaignDocs.length;
    syncLog.endTime = new Date();
    await syncLog.save();

    return { success: true, count: campaignDocs.length };
  } catch (error) {
    syncLog.status = 'error';
    syncLog.error = error instanceof Error ? error.message : 'Unknown error';
    syncLog.endTime = new Date();
    await syncLog.save();

    return { success: false, count: 0, error: syncLog.error };
  }
}

export async function syncAdvertisements(): Promise<{ success: boolean; count: number; error?: string }> {
  const syncLog = new SyncLog({
    entity: 'advertisements',
    status: 'pending',
    startTime: new Date(),
  });

  try {
    await connectDB();
    await syncLog.save();

    // Get all networks first
    const networks = await Network.find({});

    // Collect all unique advertisements
    const allAdvertisements = new Map<number, any>();

    for (const network of networks) {
      try {
        if (typeof (network as any).broadstreet_id !== 'number') {
          continue;
        }

        const advertisements = await broadstreetAPI.getAdvertisements({ networkId: (network as any).broadstreet_id });

        advertisements.forEach(advertisement => {
          // Only add if we haven't seen this advertisement ID before
          const adBsId = (advertisement as any).broadstreet_id ?? (advertisement as any).id;
          if (!allAdvertisements.has(adBsId)) {
            allAdvertisements.set(adBsId, {
              broadstreet_id: adBsId,
              name: advertisement.name,
              updated_at: advertisement.updated_at,
              type: advertisement.type,
              advertiser: advertisement.advertiser,
              active: advertisement.active,
              active_placement: advertisement.active_placement,
              preview_url: advertisement.preview_url,
            });
          }
        });
      } catch (error: any) {
        // Handle errors gracefully - silently continue
        continue;
      }
    }

    // Upsert all unique advertisements
    const advertisementDocs = Array.from(allAdvertisements.values());
    if (advertisementDocs.length > 0) {
      await cleanupLegacyIndexes(Advertisement);

      await Advertisement.bulkWrite(
        advertisementDocs.map((doc) => ({
          updateOne: {
            filter: { broadstreet_id: doc.broadstreet_id },
            update: { $set: doc },
            upsert: true,
          },
        }))
      );
    }

    // Update sync log
    syncLog.status = 'success';
    syncLog.recordCount = advertisementDocs.length;
    syncLog.endTime = new Date();
    await syncLog.save();

    return { success: true, count: advertisementDocs.length };
  } catch (error) {
    syncLog.status = 'error';
    syncLog.error = error instanceof Error ? error.message : 'Unknown error';
    syncLog.endTime = new Date();
    await syncLog.save();

    return { success: false, count: 0, error: syncLog.error };
  }
}

interface SyncResult {
  success: boolean;
  count: number;
  error?: string;
}

export async function syncPlacements(): Promise<{ success: boolean; count: number; error?: string }> {
  const syncLog = new SyncLog({
    entity: 'placements',
    status: 'pending',
    startTime: new Date(),
  });

  try {
    await connectDB();
    await syncLog.save();

    // Clear all placements from campaigns first
    await Campaign.updateMany({}, { $unset: { placements: 1 } });

    // Get all campaigns and fetch their placements
    const campaigns = await Campaign.find({});
    let totalPlacements = 0;

    for (const campaign of campaigns) {
      try {
        // Use Broadstreet campaign identifier, not Mongo _id
        const campBsId = (campaign as any).broadstreet_id;
        if (typeof campBsId !== 'number') {
          continue;
        }
        const apiPlacements = await broadstreetAPI.getPlacements(campBsId);
        
        if (apiPlacements.length > 0) {
          // Update the campaign with placements using MongoDB _id
          const coerced = apiPlacements
            .map((placement: any) => {
              const adId = Number((placement as any).advertisement_id ?? (placement as any).advertisement_broadstreet_id);
              const zoneId = Number((placement as any).zone_id ?? (placement as any).zone_broadstreet_id);
              if (!Number.isFinite(adId) || !Number.isFinite(zoneId)) {
                return null;
              }
              return {
                advertisement_id: adId,
                zone_id: zoneId,
                restrictions: (placement as any).restrictions || [],
              };
            })
            .filter(Boolean) as Array<{ advertisement_id: number; zone_id: number; restrictions: string[] }>; 

          const updateResult = await Campaign.updateOne(
            { _id: campaign._id },
            { 
              placements: coerced
            }
          );
          console.log(`Campaign ${(campaign as any).broadstreet_id}: embedded ${apiPlacements.length} placement(s). Updated ${updateResult.modifiedCount}, matched ${updateResult.matchedCount}.`);
        } else {
          // Ensure placements is an empty array if none returned
          await Campaign.updateOne(
            { _id: campaign._id },
            { placements: [] }
          );
        }
        
        totalPlacements += apiPlacements.length;
      } catch (error: any) {
        // Handle duplicate key errors gracefully
        if (error.code === 11000) {
          console.log(`Duplicate key errors ignored for campaign ${(campaign as any).broadstreet_id} placements`);
        } else {
          console.error(`Error syncing placements for campaign ${(campaign as any).broadstreet_id}:`, error);
        }
      }
    }

    // Update sync log
    syncLog.status = 'success';
    syncLog.recordCount = totalPlacements;
    syncLog.endTime = new Date();
    await syncLog.save();

    // Normalize schema: ensure placements array exists on all campaigns
    await Campaign.updateMany({ placements: { $exists: false } }, { $set: { placements: [] } });
    return { success: true, count: totalPlacements };
  } catch (error) {
    syncLog.status = 'error';
    syncLog.error = error instanceof Error ? error.message : 'Unknown error';
    syncLog.endTime = new Date();
    await syncLog.save();

    return { success: false, count: 0, error: syncLog.error };
  }
}

export async function syncAll(): Promise<{ success: boolean; results: Record<string, SyncResult>; error?: string }> {
  const results: Record<string, SyncResult> = {
    networks: { success: false, count: 0 },
    advertisers: { success: false, count: 0 },
    zones: { success: false, count: 0 },
    campaigns: { success: false, count: 0 },
    advertisements: { success: false, count: 0 },
    placements: { success: false, count: 0 },
  };

  try {
    // Sync in order of dependencies
    results.networks = await syncNetworks();
    results.advertisers = await syncAdvertisers();
    results.zones = await syncZones();
    results.campaigns = await syncCampaigns();
    results.advertisements = await syncAdvertisements();
    results.placements = await syncPlacements();

    const allSuccessful = Object.values(results).every((result: SyncResult) => result.success);

    return { success: allSuccessful, results };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, results, error: message };
  }
}

// -----------------------------------------------------------------------------
// Entity-specific ID resolution helpers (using consolidated utility)
// These are kept for backward compatibility with existing code
// -----------------------------------------------------------------------------

export async function resolveAdvertiserBroadstreetId(ref: { broadstreet_id?: number; mongo_id?: string }): Promise<number | null> {
  return resolveBroadstreetId(ref, LocalAdvertiser);
}

export async function resolveZoneBroadstreetId(ref: { broadstreet_id?: number; mongo_id?: string }): Promise<number | null> {
  return resolveBroadstreetId(ref, LocalZone);
}
