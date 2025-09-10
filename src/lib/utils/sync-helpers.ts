import connectDB from '../mongodb';
import broadstreetAPI from '../broadstreet-api';
import { parseZoneName } from './zone-parser';

// Import models
import Network from '../models/network';
import Advertiser from '../models/advertiser';
import Zone from '../models/zone';
import Campaign from '../models/campaign';
import Advertisement from '../models/advertisement';
import Placement from '../models/placement';
import SyncLog from '../models/sync-log';

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
    
    // Clear existing networks and insert new ones
    await Network.deleteMany({});
    
    const networkDocs = networks.map(network => ({
      id: network.id,
      name: network.name,
      group_id: network.group_id,
      web_home_url: network.web_home_url,
      logo: network.logo,
      valet_active: network.valet_active,
      path: network.path,
      advertiser_count: network.advertiser_count,
      zone_count: network.zone_count,
    }));

    await Network.insertMany(networkDocs);

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

    // Clear existing advertisers
    await Advertiser.deleteMany({});

    // Collect all unique advertisers
    const allAdvertisers = new Map<number, any>();

    for (const network of networks) {
      try {
        const advertisers = await broadstreetAPI.getAdvertisers(network.id);
        
        advertisers.forEach(advertiser => {
          // Only add if we haven't seen this advertiser ID before
          if (!allAdvertisers.has(advertiser.id)) {
            allAdvertisers.set(advertiser.id, {
              id: advertiser.id,
              name: advertiser.name,
              logo: advertiser.logo,
              web_home_url: advertiser.web_home_url,
              notes: advertiser.notes,
              admins: advertiser.admins,
            });
          }
        });
      } catch (error: any) {
        // Handle duplicate key errors gracefully
        if (error.code === 11000) {
          console.log(`Duplicate key errors ignored for network ${network.id} advertisers`);
        } else {
          console.error(`Error syncing advertisers for network ${network.id}:`, error);
        }
      }
    }

    // Insert all unique advertisers
    const advertiserDocs = Array.from(allAdvertisers.values());
    if (advertiserDocs.length > 0) {
      try {
        await Advertiser.insertMany(advertiserDocs);
      } catch (error: any) {
        // Handle duplicate key errors gracefully
        if (error.code === 11000) {
          console.log(`Duplicate key errors ignored for advertisers (${advertiserDocs.length} records)`);
        } else {
          throw error; // Re-throw non-duplicate errors
        }
      }
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

    // Clear existing zones
    await Zone.deleteMany({});

    // Collect all unique zones
    const allZones = new Map<number, any>();

    for (const network of networks) {
      try {
        const zones = await broadstreetAPI.getZones(network.id);
        
        zones.forEach(zone => {
          // Only add if we haven't seen this zone ID before
          if (!allZones.has(zone.id)) {
            const parsed = parseZoneName(zone.name);
            allZones.set(zone.id, {
              id: zone.id,
              name: zone.name,
              network_id: zone.network_id,
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
        // Handle duplicate key errors gracefully
        if (error.code === 11000) {
          console.log(`Duplicate key errors ignored for network ${network.id} zones`);
        } else {
          console.error(`Error syncing zones for network ${network.id}:`, error);
        }
      }
    }

    // Insert all unique zones
    const zoneDocs = Array.from(allZones.values());
    if (zoneDocs.length > 0) {
      try {
        await Zone.insertMany(zoneDocs);
      } catch (error: any) {
        // Handle duplicate key errors gracefully
        if (error.code === 11000) {
          console.log(`Duplicate key errors ignored for zones (${zoneDocs.length} records)`);
        } else {
          throw error; // Re-throw non-duplicate errors
        }
      }
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

    // Clear existing campaigns
    await Campaign.deleteMany({});

    // Collect all unique campaigns
    const allCampaigns = new Map<number, any>();

    for (const advertiser of advertisers) {
      try {
        const campaigns = await broadstreetAPI.getCampaignsByAdvertiser(advertiser.id);

        campaigns.forEach(campaign => {
          // Only add if we haven't seen this campaign ID before
          if (!allCampaigns.has(campaign.id)) {
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

            allCampaigns.set(campaign.id, {
              id: campaign.id,
              name: campaign.name,
              advertiser_id: campaign.advertiser_id,
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
        // Handle duplicate key errors gracefully
        if (error.code === 11000) {
          console.log(`Duplicate key errors ignored for advertiser ${advertiser.id} campaigns`);
        } else {
          console.error(`Error syncing campaigns for advertiser ${advertiser.id}:`, error);
        }
      }
    }

    // Insert all unique campaigns
    const campaignDocs = Array.from(allCampaigns.values());
    if (campaignDocs.length > 0) {
      try {
        await Campaign.insertMany(campaignDocs);
      } catch (error: any) {
        // Handle duplicate key errors gracefully
        if (error.code === 11000) {
          console.log(`Duplicate key errors ignored for campaigns (${campaignDocs.length} records)`);
        } else {
          throw error; // Re-throw non-duplicate errors
        }
      }
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

    // Clear existing advertisements
    await Advertisement.deleteMany({});

    // Collect all unique advertisements
    const allAdvertisements = new Map<number, any>();

    for (const network of networks) {
      try {
        const advertisements = await broadstreetAPI.getAdvertisements({ networkId: network.id });

        advertisements.forEach(advertisement => {
          // Only add if we haven't seen this advertisement ID before
          if (!allAdvertisements.has(advertisement.id)) {
            allAdvertisements.set(advertisement.id, {
              id: advertisement.id,
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
        // Handle duplicate key errors gracefully
        if (error.code === 11000) {
          console.log(`Duplicate key errors ignored for network ${network.id} advertisements`);
        } else {
          console.error(`Error syncing advertisements for network ${network.id}:`, error);
        }
      }
    }

    // Insert all unique advertisements
    const advertisementDocs = Array.from(allAdvertisements.values());
    if (advertisementDocs.length > 0) {
      try {
        await Advertisement.insertMany(advertisementDocs);
      } catch (error: any) {
        // Handle duplicate key errors gracefully
        if (error.code === 11000) {
          console.log(`Duplicate key errors ignored for advertisements (${advertisementDocs.length} records)`);
        } else {
          throw error; // Re-throw non-duplicate errors
        }
      }
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
        const apiPlacements = await broadstreetAPI.getPlacements(campaign.id);
        
        if (apiPlacements.length > 0) {
          // Update the campaign with placements using MongoDB _id
          const updateResult = await Campaign.updateOne(
            { _id: campaign._id },
            { 
              placements: apiPlacements.map(placement => ({
                advertisement_id: placement.advertisement_id,
                zone_id: placement.zone_id,
                restrictions: placement.restrictions || [],
              }))
            }
          );
          console.log(`Campaign ${campaign.id}: Updated ${updateResult.modifiedCount} document(s), matched ${updateResult.matchedCount} document(s)`);
        }
        
        totalPlacements += apiPlacements.length;
      } catch (error: any) {
        // Handle duplicate key errors gracefully
        if (error.code === 11000) {
          console.log(`Duplicate key errors ignored for campaign ${campaign.id} placements`);
        } else {
          console.error(`Error syncing placements for campaign ${campaign.id}:`, error);
        }
      }
    }

    // Update sync log
    syncLog.status = 'success';
    syncLog.recordCount = totalPlacements;
    syncLog.endTime = new Date();
    await syncLog.save();

    return { success: true, count: totalPlacements };
  } catch (error) {
    syncLog.status = 'error';
    syncLog.error = error instanceof Error ? error.message : 'Unknown error';
    syncLog.endTime = new Date();
    await syncLog.save();

    return { success: false, count: 0, error: syncLog.error };
  }
}

export async function syncAll(): Promise<{ success: boolean; results: Record<string, SyncResult> }> {
  const results: Record<string, SyncResult> = {};

  try {
    console.log('Starting full sync...');

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
    return {
      success: false,
      results: {
        ...results,
        error: {
          success: false,
          count: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    };
  }
}
