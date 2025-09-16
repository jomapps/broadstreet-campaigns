import connectDB from './mongodb';
import broadstreetAPI from './broadstreet-api';

// Import local models
import LocalAdvertiser, { ILocalAdvertiser } from './models/local-advertiser';
import LocalCampaign, { ILocalCampaign } from './models/local-campaign';
import LocalZone, { ILocalZone } from './models/local-zone';
import Placement from './models/placement';
import SyncLog from './models/sync-log';

// Import regular models for reference data
import Network from './models/network';
import Advertisement from './models/advertisement';
import Advertiser from './models/advertiser';
import { resolveAdvertiserBroadstreetId } from './utils/sync-helpers';
import { auditService } from './audit-service';
import { progressService } from './progress-service';
import { withRateLimit } from './rate-limiter';
import { placementService } from './placement-service';

// Types for sync operations
export interface SyncResult<T = any> {
  success: boolean;
  entity?: T;
  localEntity: ILocalAdvertiser | ILocalCampaign | ILocalZone;
  syncedAt?: Date;
  error?: string;
  code?: 'DUPLICATE' | 'DEPENDENCY' | 'NETWORK' | 'VALIDATION' | 'AUTH' | 'LINKED_DUPLICATE';
  details?: any;
  retryCount?: number;
  retryable?: boolean;
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
  // Local type stores multiple restriction strings; API expects a single string.
  // Conversion to a single restriction is performed at API call sites.
  restrictions?: string[];
}

class SyncService {
  private retryAttempts: number;
  private retryDelay: number;
  private maxRetryDelay: number;

  constructor() {
    this.retryAttempts = parseInt(process.env.SYNC_RETRY_ATTEMPTS || '3');
    this.retryDelay = parseInt(process.env.SYNC_RETRY_DELAY || '1000');
    this.maxRetryDelay = parseInt(process.env.SYNC_MAX_RETRY_DELAY || '30000'); // 30 seconds max
  }

  /**
   * Execute a sync operation with retry logic and exponential backoff
   */
  private async executeWithRetry<T>(
    operation: () => Promise<SyncResult<T>>,
    entityName: string,
    maxRetries: number = this.retryAttempts
  ): Promise<SyncResult<T>> {
    let lastResult: SyncResult<T>;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        lastResult = await operation();

        if (lastResult.success) {
          return lastResult;
        }

        // Don't retry validation, dependency, or auth errors
        if (lastResult.code === 'VALIDATION' ||
            lastResult.code === 'DEPENDENCY' ||
            lastResult.code === 'AUTH') {
          lastResult.retryable = false;
          return lastResult;
        }

        // Only retry network errors
        if (lastResult.code === 'NETWORK' && attempt < maxRetries) {
          const delay = Math.min(
            Math.pow(2, attempt) * this.retryDelay,
            this.maxRetryDelay
          );

          console.log(`[Retry ${attempt}/${maxRetries}] ${entityName} failed, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));

          lastResult.retryCount = attempt;
          lastResult.retryable = true;
          continue;
        }

        // Mark as non-retryable if max retries reached
        lastResult.retryable = false;
        return lastResult;

      } catch (error) {
        lastResult = {
          success: false,
          localEntity: {} as any,
          error: error instanceof Error ? error.message : 'Unknown error',
          code: 'NETWORK',
          retryCount: attempt,
          retryable: attempt < maxRetries
        };

        if (attempt < maxRetries) {
          const delay = Math.min(
            Math.pow(2, attempt) * this.retryDelay,
            this.maxRetryDelay
          );

          console.log(`[Retry ${attempt}/${maxRetries}] ${entityName} threw error, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
    }

    return lastResult!;
  }

  /**
   * Classify API errors into appropriate error codes
   */
  private classifyError(error: any): { code: SyncResult['code']; message: string } {
    if (error.status === 401) {
      return { code: 'AUTH', message: 'Authentication failed - invalid or expired API token' };
    }

    if (error.status === 422) {
      return { code: 'VALIDATION', message: 'Validation failed - check entity data format' };
    }

    if (error.status === 404) {
      return { code: 'DEPENDENCY', message: 'Required dependency not found' };
    }

    if (error.status === 409) {
      return { code: 'DUPLICATE', message: 'Entity already exists with this name' };
    }

    if (error.status >= 500) {
      return { code: 'NETWORK', message: 'Server error - operation will be retried' };
    }

    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return { code: 'NETWORK', message: 'Network connectivity issue - operation will be retried' };
    }

    // Default to network error for unknown issues
    return { code: 'NETWORK', message: error.message || 'Unknown network error' };
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

        // Resolve advertiser Broadstreet ID using explicit field resolution
        const advertiserBroadstreetId = await resolveAdvertiserBroadstreetId(
          typeof campaign.advertiser_id === 'number'
            ? { broadstreet_id: campaign.advertiser_id }
            : { mongo_id: campaign.advertiser_id as any }
        );

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
              original_broadstreet_id: placement.zone_id,
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
    return this.executeWithRetry(async () => {
      const result: SyncResult = {
        success: false,
        localEntity: localAdvertiser
      };

      try {
        await connectDB();

        // Check for duplicates; if exists, link instead of failing
        const exists = await withRateLimit(
          () => broadstreetAPI.checkExistingAdvertiser(
            localAdvertiser.name,
            localAdvertiser.network_id
          ),
          1, // Higher priority for check operations
          `check-advertiser-${localAdvertiser._id}`
        );

        if (exists) {
          // Try to find the existing advertiser and link it
          const existing: any = await withRateLimit(
            () => broadstreetAPI.findAdvertiserByName(localAdvertiser.network_id, localAdvertiser.name),
            1,
            `find-advertiser-${localAdvertiser._id}`
          );
          if (existing && (existing as any).id) {
            localAdvertiser.original_broadstreet_id = (existing as any).id;
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

        // Create advertiser in Broadstreet with rate limiting
        const broadstreetAdvertiser: any = await withRateLimit(
          () => broadstreetAPI.createAdvertiser({
            name: localAdvertiser.name,
            network_id: localAdvertiser.network_id,
            logo: localAdvertiser.logo,
            web_home_url: localAdvertiser.web_home_url,
            notes: localAdvertiser.notes,
            admins: localAdvertiser.admins
          }),
          0, // Normal priority for create operations
          `create-advertiser-${localAdvertiser._id}`
        );

        // Update local advertiser with Broadstreet ID
        localAdvertiser.original_broadstreet_id = (broadstreetAdvertiser as any).id;
        localAdvertiser.synced_with_api = true;
        localAdvertiser.synced_at = new Date();
        localAdvertiser.sync_errors = [];
        await localAdvertiser.save();

        result.success = true;
        result.entity = broadstreetAdvertiser;
        result.syncedAt = new Date();

      } catch (error) {
        const classified = this.classifyError(error);
        result.error = classified.message;
        result.code = classified.code;

        // Update local advertiser with error
        localAdvertiser.sync_errors.push(result.error);
        await localAdvertiser.save();
      }

      return result;
    }, `Advertiser "${localAdvertiser.name}"`);
  }

  /**
   * Sync a single zone to Broadstreet
   */
  async syncZone(localZone: ILocalZone): Promise<SyncResult> {
    return this.executeWithRetry(async () => {
      const result: SyncResult = {
        success: false,
        localEntity: localZone
      };

      try {
        await connectDB();

        // Check for duplicates with rate limiting
        const exists = await withRateLimit(
          () => broadstreetAPI.checkExistingZone(
            localZone.name,
            localZone.network_id
          ),
          1, // Higher priority for check operations
          `check-zone-${localZone._id}`
        );

        if (exists) {
          result.error = `Zone "${localZone.name}" already exists in Broadstreet`;
          result.code = 'DUPLICATE';
          console.log('[syncZone] Duplicate detected, skipping create:', { name: localZone.name, network_id: localZone.network_id });
          return result;
        }

        // Create zone in Broadstreet with rate limiting
        const payload = {
          name: localZone.name,
          network_id: localZone.network_id,
          alias: localZone.alias,
          self_serve: localZone.self_serve
        };
        console.log('[syncZone] POST /zones payload:', payload);
        const broadstreetZone = await withRateLimit(
          () => broadstreetAPI.createZone(payload),
          0, // Normal priority for create operations
          `create-zone-${localZone._id}`
        );

        // Update local zone with Broadstreet ID
        localZone.original_broadstreet_id = (broadstreetZone as any).id;
        localZone.synced_with_api = true;
        localZone.synced_at = new Date();
        localZone.sync_errors = [];
        await localZone.save();

        result.success = true;
        result.entity = broadstreetZone;
        result.syncedAt = new Date();

      } catch (error) {
        const classified = this.classifyError(error);
        result.error = classified.message;
        result.code = classified.code;
        console.error('[syncZone] Error during create:', result.error);

        // Update local zone with error
        localZone.sync_errors.push(result.error);
        await localZone.save();
      }

      return result;
    }, `Zone "${localZone.name}"`);
  }

  /**
   * Sync a single campaign to Broadstreet
   */
  async syncCampaign(localCampaign: ILocalCampaign): Promise<SyncResult> {
    return this.executeWithRetry(async () => {
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

        // Resolve advertiser Broadstreet ID using explicit resolver
        const advertiserBroadstreetId = await resolveAdvertiserBroadstreetId(
          typeof localCampaign.advertiser_id === 'number'
            ? { broadstreet_id: localCampaign.advertiser_id }
            : { mongo_id: localCampaign.advertiser_id as any }
        );

        if (!advertiserBroadstreetId) {
          result.error = `Campaign depends on unknown/unsynced advertiser reference: ${localCampaign.advertiser_id}`;
          result.code = 'DEPENDENCY';
          return result;
        }

        // Check for duplicates with rate limiting
        const exists = await withRateLimit(
          () => broadstreetAPI.checkExistingCampaign(
            localCampaign.name,
            advertiserBroadstreetId
          ),
          1, // Higher priority for check operations
          `check-campaign-${localCampaign._id}`
        );

        if (exists) {
          // Link to existing campaign rather than failing
          const existing = await withRateLimit(
            () => broadstreetAPI.findCampaignByName(advertiserBroadstreetId, localCampaign.name),
            1,
            `find-campaign-${localCampaign._id}`
          );
          if (existing && (existing as any).id) {
            localCampaign.original_broadstreet_id = (existing as any).id;
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

        // Create campaign in Broadstreet with rate limiting
        const broadstreetCampaign = await withRateLimit(
          () => broadstreetAPI.createCampaign(payload),
          0, // Normal priority for create operations
          `create-campaign-${localCampaign._id}`
        );

        // Update local campaign with Broadstreet ID
        localCampaign.original_broadstreet_id = (broadstreetCampaign as any).id;
        localCampaign.synced_with_api = true;
        localCampaign.synced_at = new Date();
        localCampaign.sync_errors = [];
        await localCampaign.save();

        result.success = true;
        result.entity = broadstreetCampaign;
        result.syncedAt = new Date();

      } catch (error) {
        const classified = this.classifyError(error);
        result.error = classified.message;
        result.code = classified.code;

        // Update local campaign with error
        localCampaign.sync_errors.push(result.error);
        await localCampaign.save();
      }

      return result;
    }, `Campaign "${localCampaign.name}"`);
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
        restrictions: placement.restrictions || []
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

    let syncLogId: string | undefined;

    try {
      await connectDB();

      // Create enhanced sync log with audit service
      const syncLog = await auditService.createSyncLog(networkId, 'full');
      syncLogId = syncLog._id.toString();

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

      // Start real-time progress tracking
      progressService.startSync(syncLogId, networkId, report.totalEntities);

      // Update sync log with total entities
      await auditService.updateProgress(syncLogId, 0);

      // Phase 0: Validation
      console.log('[syncAllEntities] BEGIN validation phase');
      await auditService.startPhase(syncLogId, 'validation', 1);

      progressService.updatePhaseProgress(
        syncLogId,
        'validation',
        0,
        1,
        'Network validation',
        'Validating network access and dependencies...'
      );

      // Validate network access and API connectivity
      try {
        await withRateLimit(
          () => broadstreetAPI.getNetwork(networkId),
          2, // High priority for validation
          `validate-network-${networkId}`
        );
        console.log('[syncAllEntities] Network validation successful');
      } catch (error) {
        const validationError = `Network validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        report.errors.push(validationError);
        await auditService.completePhase(syncLogId, 'validation', 'error', validationError);
        throw new Error(validationError);
      }

      await auditService.completePhase(syncLogId, 'validation', 'success');
      console.log('[syncAllEntities] END validation phase');

      // Step 1: Sync advertisers
      console.log('[syncAllEntities] BEGIN advertisers loop');
      console.log(`Syncing ${localAdvertisers.length} advertisers...`);

      if (localAdvertisers.length > 0) {
        await auditService.startPhase(syncLogId, 'advertisers', localAdvertisers.length);

        let processedAdvertisers = 0;
        for (const advertiser of localAdvertisers) {
          // Update real-time progress
          progressService.updatePhaseProgress(
            syncLogId,
            'advertisers',
            processedAdvertisers,
            localAdvertisers.length,
            advertiser.name,
            `Syncing advertiser: ${advertiser.name}`
          );

          const result = await this.syncAdvertiser(advertiser);
          report.results.push(result);

          // Log operation to audit service
          await auditService.logOperation(syncLogId, 'advertisers', {
            entityType: 'advertiser',
            entityId: advertiser._id.toString(),
            entityName: advertiser.name,
            operation: result.code === 'LINKED_DUPLICATE' ? 'link' : 'create',
            status: result.success ? 'success' : 'error',
            errorCode: result.code,
            errorMessage: result.error,
            retryCount: result.retryCount,
            broadstreetId: result.entity?.id,
            duration: 0 // Could be enhanced with timing
          });

          if (result.success) {
            report.successfulSyncs++;
          } else {
            report.failedSyncs++;
            report.errors.push(result.error || 'Unknown error');
          }

          processedAdvertisers++;

          // Update entity counts in real-time
          progressService.updateEntityCounts(
            syncLogId,
            report.results.length,
            report.successfulSyncs,
            report.failedSyncs
          );
        }

        await auditService.completePhase(syncLogId, 'advertisers', 'success');
        await auditService.updateProgress(syncLogId, 33); // Rough progress estimate
      }

      console.log('[syncAllEntities] END advertisers loop');

      // Step 2: Sync zones
      console.log('[syncAllEntities] BEGIN zones loop');
      console.log(`Syncing ${localZones.length} zones...`);

      if (localZones.length > 0) {
        console.log('[syncAllEntities] Zones to sync:', localZones.map(z => ({ id: z._id?.toString?.(), name: z.name, network_id: z.network_id })));
        await auditService.startPhase(syncLogId, 'zones', localZones.length);

        let processedZones = 0;
        for (const zone of localZones) {
          // Update real-time progress
          progressService.updatePhaseProgress(
            syncLogId,
            'zones',
            processedZones,
            localZones.length,
            zone.name,
            `Syncing zone: ${zone.name}`
          );

          console.log('[syncAllEntities] BEFORE createZone call');
          const result = await this.syncZone(zone);
          console.log('[syncAllEntities] AFTER createZone call', { success: result.success, error: result.error, code: result.code });
          report.results.push(result);

          // Log operation to audit service
          await auditService.logOperation(syncLogId, 'zones', {
            entityType: 'zone',
            entityId: zone._id.toString(),
            entityName: zone.name,
            operation: 'create',
            status: result.success ? 'success' : 'error',
            errorCode: result.code,
            errorMessage: result.error,
            retryCount: result.retryCount,
            broadstreetId: result.entity?.id,
            duration: 0
          });

          if (result.success) {
            report.successfulSyncs++;
          } else {
            report.failedSyncs++;
            report.errors.push(result.error || 'Unknown error');
          }

          processedZones++;

          // Update entity counts in real-time
          progressService.updateEntityCounts(
            syncLogId,
            report.results.length,
            report.successfulSyncs,
            report.failedSyncs
          );
        }

        await auditService.completePhase(syncLogId, 'zones', 'success');
        await auditService.updateProgress(syncLogId, 66); // Rough progress estimate
      }

      console.log('[syncAllEntities] END zones loop');

      // Step 3: Sync campaigns
      console.log('[syncAllEntities] BEGIN campaigns loop');
      console.log(`Syncing ${localCampaigns.length} campaigns...`);

      if (localCampaigns.length > 0) {
        await auditService.startPhase(syncLogId, 'campaigns', localCampaigns.length);

        let processedCampaigns = 0;
        for (const campaign of localCampaigns) {
          // Update real-time progress
          progressService.updatePhaseProgress(
            syncLogId,
            'campaigns',
            processedCampaigns,
            localCampaigns.length,
            campaign.name,
            `Syncing campaign: ${campaign.name}`
          );

          const result = await this.syncCampaign(campaign);
          report.results.push(result);

          // Log operation to audit service
          await auditService.logOperation(syncLogId, 'campaigns', {
            entityType: 'campaign',
            entityId: campaign._id.toString(),
            entityName: campaign.name,
            operation: result.code === 'LINKED_DUPLICATE' ? 'link' : 'create',
            status: result.success ? 'success' : 'error',
            errorCode: result.code,
            errorMessage: result.error,
            retryCount: result.retryCount,
            broadstreetId: result.entity?.id,
            duration: 0
          });

          if (result.success) {
            report.successfulSyncs++;
          } else {
            report.failedSyncs++;
            report.errors.push(result.error || 'Unknown error');
          }

          processedCampaigns++;

          // Update entity counts in real-time
          progressService.updateEntityCounts(
            syncLogId,
            report.results.length,
            report.successfulSyncs,
            report.failedSyncs
          );
        }

        await auditService.completePhase(syncLogId, 'campaigns', 'success');
        await auditService.updateProgress(syncLogId, 90); // Rough progress estimate
      }

      console.log('[syncAllEntities] END campaigns loop');

      // Step 4: Migrate and sync placements using dual storage architecture
      console.log('Migrating and syncing placements...');

      // First, migrate embedded placements to collection storage
      const migrationResult = await placementService.migrateEmbeddedPlacements(networkId);
      console.log(`Migrated ${migrationResult.migrated} placements to collection storage`);

      if (migrationResult.errors.length > 0) {
        console.warn('Migration errors:', migrationResult.errors);
        report.errors.push(...migrationResult.errors);
      }

      // Get all unsynced placements from collection storage
      const unsyncedPlacements = await Placement.find({
        network_id: networkId,
        synced_with_api: false
      });

      if (unsyncedPlacements.length > 0) {
        await auditService.startPhase(syncLogId, 'placements', unsyncedPlacements.length);

        let processedPlacements = 0;
        for (const placement of unsyncedPlacements) {
          // Update real-time progress
          progressService.updatePhaseProgress(
            syncLogId,
            'placements',
            processedPlacements,
            unsyncedPlacements.length,
            `Placement ${placement.advertisement_id}`,
            `Syncing placement for advertisement ${placement.advertisement_id}`
          );

          const result = await placementService.syncPlacementToBroadstreet(placement);

          // Convert to SyncResult format for compatibility
          const syncResult = {
            success: result.success,
            entity: result.placement,
            localEntity: placement as any,
            error: result.error,
            code: result.code,
            syncedAt: result.success ? new Date() : undefined
          };

          report.results.push(syncResult);

          // Log placement operation
          await auditService.logOperation(syncLogId, 'placements', {
            entityType: 'placement',
            entityId: placement._id.toString(),
            entityName: `Advertisement ${placement.advertisement_id} placement`,
            operation: 'create',
            status: result.success ? 'success' : 'error',
            errorCode: result.code,
            errorMessage: result.error,
            retryCount: 0,
            broadstreetId: result.broadstreetId,
            duration: 0
          });

          if (result.success) {
            report.successfulSyncs++;
          } else {
            report.failedSyncs++;
            report.errors.push(result.error || 'Unknown error');
          }

          processedPlacements++;

          // Update entity counts in real-time
          progressService.updateEntityCounts(
            syncLogId,
            report.results.length,
            report.successfulSyncs,
            report.failedSyncs
          );
        }

        await auditService.completePhase(syncLogId, 'placements', 'success');
      }

      // Clean up synced embedded placements
      const cleanupResult = await placementService.cleanupSyncedEmbeddedPlacements(networkId);
      console.log(`Cleaned up ${cleanupResult.cleaned} synced embedded placements`);

      if (cleanupResult.errors.length > 0) {
        console.warn('Cleanup errors:', cleanupResult.errors);
        report.errors.push(...cleanupResult.errors);
      }

      // Phase 5: Post-sync cleanup
      console.log('[syncAllEntities] BEGIN cleanup phase');
      await auditService.startPhase(syncLogId, 'cleanup', 1);

      progressService.updatePhaseProgress(
        syncLogId,
        'cleanup',
        0,
        1,
        'Post-sync cleanup',
        'Performing post-sync cleanup and validation...'
      );

      // Cleanup operations
      let cleanupErrors: string[] = [];

      try {
        // Clear any stale sync errors for successfully synced entities
        const clearAdvertiserErrors = await LocalAdvertiser.updateMany(
          { network_id: networkId, synced_with_api: true },
          { $set: { sync_errors: [] } }
        );

        const clearZoneErrors = await LocalZone.updateMany(
          { network_id: networkId, synced_with_api: true },
          { $set: { sync_errors: [] } }
        );

        const clearCampaignErrors = await LocalCampaign.updateMany(
          { network_id: networkId, synced_with_api: true },
          { $set: { sync_errors: [] } }
        );

        console.log(`Cleared sync errors for ${clearAdvertiserErrors.modifiedCount} advertisers, ${clearZoneErrors.modifiedCount} zones, ${clearCampaignErrors.modifiedCount} campaigns`);

        // Update sync timestamps
        const now = new Date();
        await LocalAdvertiser.updateMany(
          { network_id: networkId, synced_with_api: true, synced_at: { $exists: false } },
          { $set: { synced_at: now } }
        );

        await LocalZone.updateMany(
          { network_id: networkId, synced_with_api: true, synced_at: { $exists: false } },
          { $set: { synced_at: now } }
        );

        await LocalCampaign.updateMany(
          { network_id: networkId, synced_with_api: true, synced_at: { $exists: false } },
          { $set: { synced_at: now } }
        );

      } catch (error) {
        const cleanupError = `Cleanup error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        cleanupErrors.push(cleanupError);
        console.warn(cleanupError);
      }

      await auditService.completePhase(
        syncLogId,
        'cleanup',
        cleanupErrors.length > 0 ? 'error' : 'success',
        cleanupErrors.length > 0 ? cleanupErrors.join('; ') : undefined
      );

      if (cleanupErrors.length > 0) {
        report.errors.push(...cleanupErrors);
      }

      console.log('[syncAllEntities] END cleanup phase');

      // Complete sync process
      const endTime = new Date();
      report.endTime = endTime;
      report.duration = endTime.getTime() - startTime.getTime();
      report.success = report.failedSyncs === 0;

      // Complete real-time progress tracking
      progressService.completeSync(
        syncLogId,
        report.success,
        report.success
          ? `Sync completed successfully! ${report.successfulSyncs} entities synced.`
          : `Sync completed with ${report.failedSyncs} errors. ${report.successfulSyncs} entities synced successfully.`
      );

      // Complete audit log
      await auditService.completeSyncLog(
        syncLogId,
        report.success ? 'success' : 'error',
        report.errors.length > 0 ? report.errors.join('; ') : undefined
      );
      await auditService.updateProgress(syncLogId, 100);

    } catch (error) {
      const endTime = new Date();
      report.endTime = endTime;
      report.duration = endTime.getTime() - startTime.getTime();
      report.errors.push(error instanceof Error ? error.message : 'Unknown error');

      // Complete progress tracking with error
      if (syncLogId) {
        progressService.completeSync(
          syncLogId,
          false,
          `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );

        // Complete audit log with error
        await auditService.completeSyncLog(syncLogId, 'error', error instanceof Error ? error.message : 'Unknown error');
      }
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
              restrictions: placement.restrictions
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
