import connectDB from '../mongodb';
import broadstreetAPI from '../broadstreet-api';
import { parseZoneName } from './zone-parser';
import { cleanupLegacyIndexes, resolveBroadstreetId } from './entity-helpers';
import { mapApiIds } from '../types/mapApiIds';

// Import models
import Network from '../models/network';
import Advertiser from '../models/advertiser';
import Zone from '../models/zone';
import Campaign from '../models/campaign';
import Advertisement from '../models/advertisement';
import Placement from '../models/placement';
import SyncLog from '../models/sync-log';
import LocalAdvertiser from '../models/local-advertiser';
import LocalZone from '../models/local-zone';
import LocalNetwork from '../models/local-network';
import LocalCampaign from '../models/local-campaign';
import LocalAdvertisement from '../models/local-advertisement';

export async function syncNetworks(): Promise<{ success: boolean; count: number; error?: string }> {
  const syncLog = new SyncLog({
    networkId: -1, // Special ID for global sync operations
    syncType: 'full',
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

    const networkDocs = networks.map(network => {
      const mapped = mapApiIds(network as any, { stripId: true });
      return {
        broadstreet_id: mapped.broadstreet_id,
        name: mapped.name,
        group_id: mapped.group_id,
        web_home_url: mapped.web_home_url,
        logo: mapped.logo,
        valet_active: mapped.valet_active,
        path: mapped.path,
        advertiser_count: mapped.advertiser_count,
        zone_count: mapped.zone_count,
      };
    });

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
    networkId: -1, // Special ID for global sync operations
    syncType: 'full',
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
        if (typeof network.broadstreet_id !== 'number') {
          continue;
        }

        const advertisers = await broadstreetAPI.getAdvertisers(network.broadstreet_id);

        advertisers.forEach(advertiser => {
          const mapped = mapApiIds(advertiser as any, { stripId: true });
          // Only add if we haven't seen this advertiser ID before
          if (mapped.broadstreet_id && !allAdvertisers.has(mapped.broadstreet_id)) {
            allAdvertisers.set(mapped.broadstreet_id, {
              broadstreet_id: mapped.broadstreet_id,
              name: mapped.name,
              logo: mapped.logo,
              web_home_url: mapped.web_home_url,
              notes: mapped.notes,
              admins: mapped.admins,
              // Persist network context so we can derive campaign network_id when needed
              network_id: network.broadstreet_id,
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
    networkId: -1, // Special ID for global sync operations
    syncType: 'full',
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
        if (typeof network.broadstreet_id !== 'number') {
          console.warn(`[syncZones] Skipping network with invalid broadstreet_id:`, { _id: network._id?.toString?.(), broadstreet_id: network.broadstreet_id });
          continue;
        }

        const zones = await broadstreetAPI.getZones(network.broadstreet_id);

        zones.forEach(zone => {
          const mapped = mapApiIds(zone as any, { stripId: true });
          // Only add if we haven't seen this zone ID before
          if (mapped.broadstreet_id && !allZones.has(mapped.broadstreet_id)) {
            const parsed = parseZoneName(mapped.name);
            allZones.set(mapped.broadstreet_id, {
              broadstreet_id: mapped.broadstreet_id,
              name: mapped.name,
              network_id: mapped.network_id ?? network.broadstreet_id,
              alias: mapped.alias,
              self_serve: mapped.self_serve,
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
    networkId: -1, // Special ID for global sync operations
    syncType: 'full',
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
        if (typeof advertiser.broadstreet_id !== 'number') {
          continue;
        }

        const campaigns = await broadstreetAPI.getCampaignsByAdvertiser(advertiser.broadstreet_id);

        campaigns.forEach(campaign => {
          const mapped = mapApiIds(campaign as any, { stripId: true });
          // Only add if we haven't seen this campaign ID before
          if (mapped.broadstreet_id && !allCampaigns.has(mapped.broadstreet_id)) {
            // Preserve raw payload for round-trip safety
            const raw = campaign;

            // Normalize weight: Broadstreet may return strings like "default" or "remnant"
            const weightRaw = (mapped as unknown as Record<string, unknown>).weight as string | number | undefined;
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
            const startDateRaw = (mapped as unknown as Record<string, unknown>).start_date as string | undefined;
            const endDateRaw = (mapped as unknown as Record<string, unknown>).end_date as string | undefined;

            // display_type: keep raw and normalized (optional)
            const displayTypeRaw = (mapped as unknown as Record<string, unknown>).display_type as string | undefined;
            const allowedDisplay = ['no_repeat', 'allow_repeat_campaign', 'allow_repeat_advertisement', 'force_repeat_campaign'] as const;
            const displayType = allowedDisplay.includes(displayTypeRaw as typeof allowedDisplay[number]) ? displayTypeRaw : undefined;

            allCampaigns.set(mapped.broadstreet_id, {
              broadstreet_id: mapped.broadstreet_id,
              name: mapped.name,
              advertiser_id: mapped.advertiser_id ?? advertiser.broadstreet_id,
              start_date: startDateRaw,
              end_date: endDateRaw,
              max_impression_count: mapped.max_impression_count,
              display_type: displayType,
              active: mapped.active,
              weight,
              path: mapped.path,
              archived: mapped.archived,
              pacing_type: mapped.pacing_type,
              impression_max_type: mapped.impression_max_type,
              paused: mapped.paused,
              notes: mapped.notes,
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
    networkId: -1, // Special ID for global sync operations
    syncType: 'full',
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
        if (typeof network.broadstreet_id !== 'number') {
          continue;
        }

        const advertisements = await broadstreetAPI.getAdvertisements({ networkId: network.broadstreet_id });

        advertisements.forEach(advertisement => {
          const mapped = mapApiIds(advertisement as any, { stripId: true });
          // Only add if we haven't seen this advertisement ID before
          if (mapped.broadstreet_id && !allAdvertisements.has(mapped.broadstreet_id)) {
            allAdvertisements.set(mapped.broadstreet_id, {
              broadstreet_id: mapped.broadstreet_id,
              name: mapped.name,
              updated_at: mapped.updated_at,
              type: mapped.type,
              advertiser: mapped.advertiser,
              active: mapped.active,
              active_placement: mapped.active_placement,
              preview_url: mapped.preview_url,
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
    networkId: -1, // Special ID for global sync operations
    syncType: 'full',
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
        if (typeof campaign.broadstreet_id !== 'number') {
          continue;
        }
        const apiPlacements = await broadstreetAPI.getPlacements(campaign.broadstreet_id);

        if (apiPlacements.length > 0) {
          // Update the campaign with placements using MongoDB _id
          const coerced = apiPlacements
            .map((placement: any) => {
              const mapped = mapApiIds(placement as any, { stripId: true });
              const adId = Number(mapped.advertisement_id ?? mapped.advertisement_broadstreet_id);
              const zoneId = Number(mapped.zone_id ?? mapped.zone_broadstreet_id);
              if (!Number.isFinite(adId) || !Number.isFinite(zoneId)) {
                return null;
              }
              return {
                advertisement_id: adId,
                zone_id: zoneId,
                restrictions: mapped.restrictions || [],
              };
            })
            .filter(Boolean) as Array<{ advertisement_id: number; zone_id: number; restrictions: string[] }>;

          const updateResult = await Campaign.updateOne(
            { _id: campaign._id },
            {
              placements: coerced
            }
          );
          console.log(`Campaign ${campaign.broadstreet_id}: embedded ${apiPlacements.length} placement(s). Updated ${updateResult.modifiedCount}, matched ${updateResult.matchedCount}.`);
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
          console.log(`Duplicate key errors ignored for campaign ${campaign.broadstreet_id} placements`);
        } else {
          console.error(`Error syncing placements for campaign ${campaign.broadstreet_id}:`, error);
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

/**
 * Clean up all Broadstreet-sourced collections AND local-only collections before fresh sync
 * Preserves only themes (which don't have direct entity references)
 */
export async function cleanupBroadstreetCollections(): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    await connectDB();

    console.log('[cleanupBroadstreetCollections] Deleting all Broadstreet-sourced and local-only data...');

    // Delete all Broadstreet-sourced collections (type #1 data) AND local-only collections (type #2 data)
    // Local collections might have references to old Broadstreet entities, so clean slate is needed
    const [
      networkDel, advertiserDel, zoneDel, campaignDel, advertisementDel, placementDel,
      localNetworkDel, localAdvertiserDel, localZoneDel, localCampaignDel, localAdvertisementDel
    ] = await Promise.all([
      // Broadstreet-sourced collections
      Network.deleteMany({}), // All networks come from Broadstreet
      Advertiser.deleteMany({}), // All advertisers come from Broadstreet
      Zone.deleteMany({}), // All zones come from Broadstreet
      Campaign.deleteMany({}), // All campaigns come from Broadstreet
      Advertisement.deleteMany({}), // All advertisements come from Broadstreet
      Placement.deleteMany({}), // All placements (both local and synced) - will be recreated during sync

      // Local-only collections (might have stale references to old Broadstreet entities)
      LocalNetwork.deleteMany({}), // Delete all local networks
      LocalAdvertiser.deleteMany({}), // Delete all local advertisers
      LocalZone.deleteMany({}), // Delete all local zones
      LocalCampaign.deleteMany({}), // Delete all local campaigns
      LocalAdvertisement.deleteMany({}), // Delete all local advertisements
    ]);

    // Note: We preserve only Themes (type #3) as they don't have direct entity references

    const totalDeleted = (networkDel.deletedCount || 0) +
                        (advertiserDel.deletedCount || 0) +
                        (zoneDel.deletedCount || 0) +
                        (campaignDel.deletedCount || 0) +
                        (advertisementDel.deletedCount || 0) +
                        (placementDel.deletedCount || 0) +
                        (localNetworkDel.deletedCount || 0) +
                        (localAdvertiserDel.deletedCount || 0) +
                        (localZoneDel.deletedCount || 0) +
                        (localCampaignDel.deletedCount || 0) +
                        (localAdvertisementDel.deletedCount || 0);

    console.log('[cleanupBroadstreetCollections] Deleted counts (Broadstreet + Local):', {
      // Broadstreet collections
      networks: networkDel.deletedCount || 0,
      advertisers: advertiserDel.deletedCount || 0,
      zones: zoneDel.deletedCount || 0,
      campaigns: campaignDel.deletedCount || 0,
      advertisements: advertisementDel.deletedCount || 0,
      placements: placementDel.deletedCount || 0,
      // Local collections
      localNetworks: localNetworkDel.deletedCount || 0,
      localAdvertisers: localAdvertiserDel.deletedCount || 0,
      localZones: localZoneDel.deletedCount || 0,
      localCampaigns: localCampaignDel.deletedCount || 0,
      localAdvertisements: localAdvertisementDel.deletedCount || 0,
      total: totalDeleted
    });

    return { success: true, count: totalDeleted };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown cleanup error';
    console.error('[cleanupBroadstreetCollections] Error:', message);
    return { success: false, count: 0, error: message };
  }
}

export async function syncAll(): Promise<{ success: boolean; results: Record<string, SyncResult>; error?: string }> {
  const results: Record<string, SyncResult> = {
    cleanup: { success: false, count: 0 },
    networks: { success: false, count: 0 },
    advertisers: { success: false, count: 0 },
    zones: { success: false, count: 0 },
    campaigns: { success: false, count: 0 },
    advertisements: { success: false, count: 0 },
    placements: { success: false, count: 0 },
  };

  try {
    // Step 1: Clean up all Broadstreet-sourced and local-only collections for fresh data
    console.log('[syncAll] Cleaning up all collections (Broadstreet + local-only)...');
    results.cleanup = await cleanupBroadstreetCollections();

    if (!results.cleanup.success) {
      console.error('[syncAll] Cleanup failed:', results.cleanup.error);
      return { success: false, results, error: results.cleanup.error };
    }

    // Step 2: Sync in order of dependencies with fresh data
    console.log('[syncAll] Starting fresh sync from Broadstreet API...');
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
