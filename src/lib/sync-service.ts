import connectDB from './mongodb';
import broadstreetAPI from './broadstreet-api';

// Import local models
import LocalAdvertiser, { ILocalAdvertiser } from './models/local-advertiser';
import LocalCampaign, { ILocalCampaign } from './models/local-campaign';
import LocalZone, { ILocalZone } from './models/local-zone';
import SyncLog from './models/sync-log';

// Import regular models for reference data
import Network from './models/network';
import Advertisement from './models/advertisement';
import Advertiser from './models/advertiser';

// Types for sync operations
export interface SyncResult<T = any> {
  success: boolean;
  entity?: T;
  localEntity: ILocalAdvertiser | ILocalCampaign | ILocalZone;
  syncedAt?: Date;
  error?: string;
  code?: 'DUPLICATE' | 'DEPENDENCY' | 'NETWORK' | 'VALIDATION';
  details?: any;
}

export interface SyncReport {
  success: boolean;
  totalEntities: number;
  successfulSyncs: number;
  failedSyncs: number;
  results: SyncResult[];
  errors: string[];
  duration: number;
  startTime: Date;
  endTime: Date;
}

export interface DryRunResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
  duplicateChecks: {
    advertisers: { name: string; exists: boolean }[];
    zones: { name: string; exists: boolean }[];
    campaigns: { name: string; exists: boolean }[];
  };
  dependencyChecks: {
    missingAdvertisers: string[];
    missingZones: string[];
    missingAdvertisements: string[];
  };
}

export interface PlacementData {
  advertisement_id: number;
  zone_id: number;
  restrictions?: string;
}

class SyncService {
  private retryAttempts: number;
  private retryDelay: number;

  constructor() {
    this.retryAttempts = parseInt(process.env.SYNC_RETRY_ATTEMPTS || '3');
    this.retryDelay = parseInt(process.env.SYNC_RETRY_DELAY || '1000');
  }

  /**
   * Perform a dry run validation of all local entities before sync
   */
  async dryRunSync(networkId: number): Promise<DryRunResult> {
    const result: DryRunResult = {
      valid: true,
      warnings: [],
      errors: [],
      duplicateChecks: {
        advertisers: [],
        zones: [],
        campaigns: []
      },
      dependencyChecks: {
        missingAdvertisers: [],
        missingZones: [],
        missingAdvertisements: []
      }
    };

    try {
      await connectDB();

      // Get all unsynced local entities for this network (ignore created_locally to avoid missing records)
      const localAdvertisers = await LocalAdvertiser.find({ 
        network_id: networkId, 
        synced_with_api: false 
      });
      const localZones = await LocalZone.find({ 
        network_id: networkId, 
        synced_with_api: false 
      });
      const localCampaigns = await LocalCampaign.find({ 
        network_id: networkId, 
        synced_with_api: false 
      });

      console.log('[dryRunSync] Unsynced counts:', {
        advertisers: localAdvertisers.length,
        zones: localZones.length,
        campaigns: localCampaigns.length,
      });

      // Check for duplicates
      for (const advertiser of localAdvertisers) {
        const exists = await broadstreetAPI.checkExistingAdvertiser(advertiser.name, networkId);
        result.duplicateChecks.advertisers.push({ name: advertiser.name, exists });
        if (exists) {
          result.errors.push(`Advertiser "${advertiser.name}" already exists in Broadstreet`);
          result.valid = false;
        }
      }

      for (const zone of localZones) {
        const exists = await broadstreetAPI.checkExistingZone(zone.name, networkId);
        result.duplicateChecks.zones.push({ name: zone.name, exists });
        if (exists) {
          result.errors.push(`Zone "${zone.name}" already exists in Broadstreet`);
          result.valid = false;
        }
      }

      // Check campaign dependencies
      for (const campaign of localCampaigns) {
        if (!campaign.advertiser_id && campaign.advertiser_id !== 0) {
          result.errors.push(`Campaign "${campaign.name}" missing advertiser_id`);
          result.valid = false;
          continue;
        }

        // Resolve advertiser Broadstreet ID from either LocalAdvertiser (_id) or main Advertiser (numeric id)
        let advertiserBroadstreetId: number | null = null;
        // If advertiser_id looks like an ObjectId string, try LocalAdvertiser
        const isObjectIdLike = typeof (campaign as any).advertiser_id === 'string' && (campaign as any).advertiser_id.length === 24;
        if (isObjectIdLike) {
          const la = await LocalAdvertiser.findOne({
            _id: (campaign as any).advertiser_id,
            synced_with_api: true,
          });
          if (la?.original_broadstreet_id) {
            advertiserBroadstreetId = la.original_broadstreet_id;
          }
        } else if (typeof campaign.advertiser_id === 'number') {
          const synced = await Advertiser.findOne({ id: campaign.advertiser_id });
          if (synced?.id) {
            advertiserBroadstreetId = synced.id;
          }
        }

        if (!advertiserBroadstreetId) {
          result.dependencyChecks.missingAdvertisers.push(campaign.name);
          result.errors.push(`Campaign "${campaign.name}" depends on unsynced/unknown advertiser reference: ${campaign.advertiser_id}`);
          result.valid = false;
          continue;
        }

        // Check for campaign name duplicates within advertiser
        const campaignExists = await broadstreetAPI.checkExistingCampaign(
          campaign.name,
          advertiserBroadstreetId
        );
        result.duplicateChecks.campaigns.push({ name: campaign.name, exists: campaignExists });
        if (campaignExists) {
          result.errors.push(`Campaign "${campaign.name}" already exists for advertiser`);
          result.valid = false;
        }
      }

      // Check placement dependencies
      for (const campaign of localCampaigns) {
        if (campaign.placements && campaign.placements.length > 0) {
          for (const placement of campaign.placements) {
            // Check if advertisement exists
            const advertisement = await Advertisement.findOne({ id: placement.advertisement_id });
            if (!advertisement) {
              result.dependencyChecks.missingAdvertisements.push(
                `Campaign "${campaign.name}" references non-existent advertisement ID: ${placement.advertisement_id}`
              );
              result.warnings.push(`Advertisement ID ${placement.advertisement_id} not found in local database`);
            }

            // Check if zone exists and is synced
            const localZone = await LocalZone.findOne({ 
              _id: placement.zone_id,
              synced_with_api: true 
            });
            if (!localZone) {
              result.dependencyChecks.missingZones.push(
                `Campaign "${campaign.name}" references unsynced zone ID: ${placement.zone_id}`
              );
              result.errors.push(`Zone ID ${placement.zone_id} not synced for campaign "${campaign.name}"`);
              result.valid = false;
            }
          }
        }
      }

    } catch (error) {
      result.valid = false;
      result.errors.push(`Dry run failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Sync a single advertiser to Broadstreet
   */
  async syncAdvertiser(localAdvertiser: ILocalAdvertiser): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      localEntity: localAdvertiser
    };

    try {
      await connectDB();

      // Check for duplicates; if exists, link instead of failing
      const exists = await broadstreetAPI.checkExistingAdvertiser(
        localAdvertiser.name, 
        localAdvertiser.network_id
      );
      
      if (exists) {
        // Try to find the existing advertiser and link it
        const existing = await broadstreetAPI.findAdvertiserByName(localAdvertiser.network_id, localAdvertiser.name);
        if (existing && existing.id) {
          localAdvertiser.original_broadstreet_id = existing.id;
          localAdvertiser.synced_with_api = true;
          localAdvertiser.synced_at = new Date();
          localAdvertiser.sync_errors = [];
          await localAdvertiser.save();
          result.success = true;
          result.entity = existing;
          result.syncedAt = new Date();
          result.code = 'LINKED_DUPLICATE';
          return result;
        }
        result.error = `Advertiser "${localAdvertiser.name}" already exists in Broadstreet`;
        result.code = 'DUPLICATE';
        return result;
      }

      // Create advertiser in Broadstreet
      const broadstreetAdvertiser = await broadstreetAPI.createAdvertiser({
        name: localAdvertiser.name,
        network_id: localAdvertiser.network_id,
        logo: localAdvertiser.logo,
        web_home_url: localAdvertiser.web_home_url,
        notes: localAdvertiser.notes,
        admins: localAdvertiser.admins
      });

      // Update local advertiser with Broadstreet ID
      localAdvertiser.original_broadstreet_id = broadstreetAdvertiser.id;
      localAdvertiser.synced_with_api = true;
      localAdvertiser.synced_at = new Date();
      localAdvertiser.sync_errors = [];
      await localAdvertiser.save();

      result.success = true;
      result.entity = broadstreetAdvertiser;
      result.syncedAt = new Date();

    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error';
      result.code = 'NETWORK';
      
      // Update local advertiser with error
      localAdvertiser.sync_errors.push(result.error);
      await localAdvertiser.save();
    }

    return result;
  }

  /**
   * Sync a single zone to Broadstreet
   */
  async syncZone(localZone: ILocalZone): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      localEntity: localZone
    };

    try {
      await connectDB();

      // Check for duplicates
      const exists = await broadstreetAPI.checkExistingZone(
        localZone.name, 
        localZone.network_id
      );
      
      if (exists) {
        result.error = `Zone "${localZone.name}" already exists in Broadstreet`;
        result.code = 'DUPLICATE';
        console.log('[syncZone] Duplicate detected, skipping create:', { name: localZone.name, network_id: localZone.network_id });
        return result;
      }

      // Create zone in Broadstreet
      const payload = {
        name: localZone.name,
        network_id: localZone.network_id,
        alias: localZone.alias,
        self_serve: localZone.self_serve
      };
      console.log('[syncZone] POST /zones payload:', payload);
      const broadstreetZone = await broadstreetAPI.createZone(payload);

      // Update local zone with Broadstreet ID
      localZone.original_broadstreet_id = broadstreetZone.id;
      localZone.synced_with_api = true;
      localZone.synced_at = new Date();
      localZone.sync_errors = [];
      await localZone.save();

      result.success = true;
      result.entity = broadstreetZone;
      result.syncedAt = new Date();

    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error';
      result.code = 'NETWORK';
      console.error('[syncZone] Error during create:', result.error);
      
      // Update local zone with error
      localZone.sync_errors.push(result.error);
      await localZone.save();
    }

    return result;
  }

  /**
   * Sync a single campaign to Broadstreet
   */
  async syncCampaign(localCampaign: ILocalCampaign): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      localEntity: localCampaign
    };

    try {
      await connectDB();

      // Check if advertiser is synced
      if (!localCampaign.advertiser_id) {
        result.error = 'Campaign missing advertiser_id';
        result.code = 'DEPENDENCY';
        return result;
      }

      // Resolve advertiser: prefer local advertiser by ObjectId, otherwise fall back to synced main Advertiser by numeric id
      let advertiserBroadstreetId: number | null = null;
      if (typeof localCampaign.advertiser_id === 'number') {
        advertiserBroadstreetId = localCampaign.advertiser_id;
      } else {
        const localAdvertiser = await LocalAdvertiser.findById(localCampaign.advertiser_id);
        if (localAdvertiser && localAdvertiser.synced_with_api && localAdvertiser.original_broadstreet_id) {
          advertiserBroadstreetId = localAdvertiser.original_broadstreet_id;
        } else {
          // Try from main Advertiser collection (synced data)
          const syncedAdvertiser = await Advertiser.findOne({ id: localCampaign.advertiser_id });
          if (syncedAdvertiser && syncedAdvertiser.id) {
            advertiserBroadstreetId = syncedAdvertiser.id;
          }
        }
      }

      if (!advertiserBroadstreetId) {
        result.error = `Campaign depends on unknown/unsynced advertiser reference: ${localCampaign.advertiser_id}`;
        result.code = 'DEPENDENCY';
        return result;
      }

      // Check for duplicates
      const exists = await broadstreetAPI.checkExistingCampaign(
        localCampaign.name, 
        advertiserBroadstreetId
      );
      
      if (exists) {
        // Link to existing campaign rather than failing
        const existing = await broadstreetAPI.findCampaignByName(advertiserBroadstreetId, localCampaign.name);
        if (existing && existing.id) {
          localCampaign.original_broadstreet_id = existing.id;
          localCampaign.synced_with_api = true;
          localCampaign.synced_at = new Date();
          localCampaign.sync_errors = [];
          await localCampaign.save();
          result.success = true;
          result.entity = existing;
          result.syncedAt = new Date();
          result.code = 'LINKED_DUPLICATE';
          return result;
        }
        result.error = `Campaign "${localCampaign.name}" already exists for advertiser`;
        result.code = 'DUPLICATE';
        return result;
      }

      // Normalize date strings to YYYY-MM-DD for API
      const normalizeDate = (d?: string) => {
        if (!d) return undefined;
        try {
          // Accept either YYYY-MM-DD or YYYY-MM-DDTHH:mm and output YYYY-MM-DD
          const onlyDate = d.split('T')[0];
          return onlyDate;
        } catch {
          return undefined;
        }
      };

      const payload: any = {
        name: localCampaign.name,
        advertiser_id: advertiserBroadstreetId,
      };

      const startDate = normalizeDate(localCampaign.start_date);
      if (startDate) payload.start_date = startDate;

      const endDate = normalizeDate(localCampaign.end_date);
      if (endDate) payload.end_date = endDate;

      if (typeof localCampaign.max_impression_count === 'number') payload.max_impression_count = localCampaign.max_impression_count;
      if (localCampaign.display_type && localCampaign.display_type !== 'no_repeat') payload.display_type = localCampaign.display_type;
      if (localCampaign.active === false) payload.active = false;
      if (typeof localCampaign.weight === 'number') payload.weight = localCampaign.weight;
      if (localCampaign.archived === true) payload.archived = true;
      if (localCampaign.pacing_type && localCampaign.pacing_type !== 'asap') payload.pacing_type = localCampaign.pacing_type;
      if (localCampaign.impression_max_type && localCampaign.impression_max_type !== 'cap') payload.impression_max_type = localCampaign.impression_max_type;
      if (localCampaign.paused === true) payload.paused = true;
      if (localCampaign.notes && localCampaign.notes.trim()) payload.notes = localCampaign.notes.trim();

      // Create campaign in Broadstreet
      const broadstreetCampaign = await broadstreetAPI.createCampaign(payload);

      // Update local campaign with Broadstreet ID
      localCampaign.original_broadstreet_id = broadstreetCampaign.id;
      localCampaign.synced_with_api = true;
      localCampaign.synced_at = new Date();
      localCampaign.sync_errors = [];
      await localCampaign.save();

      result.success = true;
      result.entity = broadstreetCampaign;
      result.syncedAt = new Date();

    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error';
      result.code = 'NETWORK';
      
      // Update local campaign with error
      localCampaign.sync_errors.push(result.error);
      await localCampaign.save();
    }

    return result;
  }

  /**
   * Create a placement in Broadstreet
   */
  async syncPlacement(campaignId: number, placement: PlacementData): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      localEntity: {} as any // Placements don't have local entities
    };

    try {
      await connectDB();

      // Verify campaign is synced
      const localCampaign = await LocalCampaign.findOne({ 
        original_broadstreet_id: campaignId,
        synced_with_api: true 
      });
      
      if (!localCampaign) {
        result.error = `Campaign with Broadstreet ID ${campaignId} not found or not synced`;
        result.code = 'DEPENDENCY';
        return result;
      }

      // Verify zone is synced
      const localZone = await LocalZone.findOne({ 
        original_broadstreet_id: placement.zone_id,
        synced_with_api: true 
      });
      
      if (!localZone) {
        result.error = `Zone with Broadstreet ID ${placement.zone_id} not found or not synced`;
        result.code = 'DEPENDENCY';
        return result;
      }

      // Verify advertisement exists
      const advertisement = await Advertisement.findOne({ id: placement.advertisement_id });
      if (!advertisement) {
        result.error = `Advertisement with ID ${placement.advertisement_id} not found`;
        result.code = 'DEPENDENCY';
        return result;
      }

      // Create placement in Broadstreet
      const broadstreetPlacement = await broadstreetAPI.createPlacement({
        campaign_id: campaignId,
        advertisement_id: placement.advertisement_id,
        zone_id: placement.zone_id,
        restrictions: placement.restrictions
      });

      result.success = true;
      result.entity = broadstreetPlacement;
      result.syncedAt = new Date();

    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error';
      result.code = 'NETWORK';
    }

    return result;
  }

  /**
   * Sync all local entities for a network in proper dependency order
   */
  async syncAllEntities(networkId: number): Promise<SyncReport> {
    const startTime = new Date();
    const report: SyncReport = {
      success: false,
      totalEntities: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      results: [],
      errors: [],
      duration: 0,
      startTime,
      endTime: new Date()
    };

    try {
      await connectDB();

      // Create sync log
      const syncLog = new SyncLog({
        entity: 'local_entities',
        status: 'pending',
        startTime,
      });
      await syncLog.save();

      // Get all unsynced local entities for this network (do not require created_locally)
      const localAdvertisers = await LocalAdvertiser.find({ 
        network_id: networkId, 
        synced_with_api: false 
      });
      const localZones = await LocalZone.find({ 
        network_id: networkId, 
        synced_with_api: false 
      });
      const localCampaigns = await LocalCampaign.find({ 
        network_id: networkId, 
        synced_with_api: false 
      });

      console.log('[syncAllEntities] Unsynced counts:', {
        advertisers: localAdvertisers.length,
        zones: localZones.length,
        campaigns: localCampaigns.length,
      });

      report.totalEntities = localAdvertisers.length + localZones.length + localCampaigns.length;

      // Step 1: Sync advertisers
      console.log('[syncAllEntities] BEGIN advertisers loop');
      console.log(`Syncing ${localAdvertisers.length} advertisers...`);
      for (const advertiser of localAdvertisers) {
        const result = await this.syncAdvertiser(advertiser);
        report.results.push(result);
        if (result.success) {
          report.successfulSyncs++;
        } else {
          report.failedSyncs++;
          report.errors.push(result.error || 'Unknown error');
        }
      }
      console.log('[syncAllEntities] END advertisers loop');

      // Step 2: Sync zones
      console.log('[syncAllEntities] BEGIN zones loop');
      console.log(`Syncing ${localZones.length} zones...`);
      if (localZones.length > 0) {
        console.log('[syncAllEntities] Zones to sync:', localZones.map(z => ({ id: z._id?.toString?.(), name: z.name, network_id: z.network_id })));
      }
      for (const zone of localZones) {
        console.log('[syncAllEntities] BEFORE createZone call');
        const result = await this.syncZone(zone);
        console.log('[syncAllEntities] AFTER createZone call', { success: result.success, error: result.error, code: result.code });
        report.results.push(result);
        if (result.success) {
          report.successfulSyncs++;
        } else {
          report.failedSyncs++;
          report.errors.push(result.error || 'Unknown error');
        }
      }
      console.log('[syncAllEntities] END zones loop');

      // Step 3: Sync campaigns
      console.log('[syncAllEntities] BEGIN campaigns loop');
      console.log(`Syncing ${localCampaigns.length} campaigns...`);
      for (const campaign of localCampaigns) {
        const result = await this.syncCampaign(campaign);
        report.results.push(result);
        if (result.success) {
          report.successfulSyncs++;
        } else {
          report.failedSyncs++;
          report.errors.push(result.error || 'Unknown error');
        }
      }
      console.log('[syncAllEntities] END campaigns loop');

      // Step 4: Create placements for synced campaigns
      console.log('Creating placements...');
      const syncedCampaigns = await LocalCampaign.find({ 
        network_id: networkId,
        synced_with_api: true,
        original_broadstreet_id: { $exists: true }
      });

      for (const campaign of syncedCampaigns) {
        if (campaign.placements && campaign.placements.length > 0) {
          for (const placement of campaign.placements) {
            const result = await this.syncPlacement(
              campaign.original_broadstreet_id!, 
              {
                advertisement_id: placement.advertisement_id,
                zone_id: placement.zone_id,
                restrictions: placement.restrictions?.[0] // Take first restriction if any
              }
            );
            report.results.push(result);
            if (result.success) {
              report.successfulSyncs++;
            } else {
              report.failedSyncs++;
              report.errors.push(result.error || 'Unknown error');
            }
          }
        }
      }

      // Update sync log
      const endTime = new Date();
      report.endTime = endTime;
      report.duration = endTime.getTime() - startTime.getTime();
      report.success = report.failedSyncs === 0;

      syncLog.status = report.success ? 'success' : 'error';
      syncLog.recordCount = report.successfulSyncs;
      syncLog.error = report.errors.length > 0 ? report.errors.join('; ') : undefined;
      syncLog.endTime = endTime;
      await syncLog.save();

    } catch (error) {
      const endTime = new Date();
      report.endTime = endTime;
      report.duration = endTime.getTime() - startTime.getTime();
      report.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return report;
  }

  /**
   * Sync all advertisers for a network
   */
  async syncAdvertisers(networkId: number): Promise<SyncResult[]> {
    await connectDB();
    const localAdvertisers = await LocalAdvertiser.find({ 
      network_id: networkId, 
      synced_with_api: false 
    });
    console.log('[syncAdvertisers] Unsynced advertisers:', localAdvertisers.length);

    const results: SyncResult[] = [];
    for (const advertiser of localAdvertisers) {
      const result = await this.syncAdvertiser(advertiser);
      results.push(result);
    }

    return results;
  }

  /**
   * Sync all zones for a network
   */
  async syncZones(networkId: number): Promise<SyncResult[]> {
    await connectDB();
    const localZones = await LocalZone.find({ 
      network_id: networkId, 
      synced_with_api: false 
    });
    console.log('[syncZones] Unsynced zones:', localZones.length);

    const results: SyncResult[] = [];
    for (const zone of localZones) {
      const result = await this.syncZone(zone);
      results.push(result);
    }

    return results;
  }

  /**
   * Sync all campaigns for a network
   */
  async syncCampaigns(networkId: number, syncedAdvertisers?: SyncResult[]): Promise<SyncResult[]> {
    await connectDB();
    const localCampaigns = await LocalCampaign.find({ 
      network_id: networkId, 
      synced_with_api: false 
    });
    console.log('[syncCampaigns] Unsynced campaigns:', localCampaigns.length);

    const results: SyncResult[] = [];
    for (const campaign of localCampaigns) {
      const result = await this.syncCampaign(campaign);
      results.push(result);
    }

    return results;
  }

  /**
   * Create placements for all synced campaigns
   */
  async createPlacements(networkId: number): Promise<SyncResult[]> {
    await connectDB();
    const syncedCampaigns = await LocalCampaign.find({ 
      network_id: networkId,
      synced_with_api: true,
      original_broadstreet_id: { $exists: true }
    });

    const results: SyncResult[] = [];
    for (const campaign of syncedCampaigns) {
      if (campaign.placements && campaign.placements.length > 0) {
        for (const placement of campaign.placements) {
          const result = await this.syncPlacement(
            campaign.original_broadstreet_id!, 
            {
              advertisement_id: placement.advertisement_id,
              zone_id: placement.zone_id,
              restrictions: placement.restrictions?.[0]
            }
          );
          results.push(result);
        }
      }
    }

    return results;
  }
}

export const syncService = new SyncService();
export default syncService;
