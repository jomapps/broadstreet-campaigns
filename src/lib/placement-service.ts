import connectDB from './mongodb';
import Placement, { IPlacement } from './models/placement';
import LocalCampaign, { ILocalCampaign } from './models/local-campaign';
import LocalZone, { ILocalZone } from './models/local-zone';
import { broadstreetAPI } from './broadstreet-api';
import { withRateLimit } from './rate-limiter';

export interface PlacementCreateData {
  network_id: number;
  advertiser_id: number;
  advertisement_id: number;
  campaign_id?: number;
  campaign_mongo_id?: string;
  zone_id?: number;
  zone_mongo_id?: string;
  restrictions?: string[];
}

export interface PlacementSyncResult {
  success: boolean;
  placement?: IPlacement;
  broadstreetId?: number;
  error?: string;
  code?: 'DUPLICATE' | 'DEPENDENCY' | 'NETWORK' | 'VALIDATION';
}

export class PlacementService {
  /**
   * Create a placement in local collection
   */
  async createLocalPlacement(data: PlacementCreateData): Promise<IPlacement> {
    await connectDB();
    
    const placement = new Placement({
      ...data,
      created_locally: true,
      synced_with_api: false,
      created_at: new Date(),
      sync_errors: []
    });
    
    return await placement.save();
  }

  /**
   * Sync a local placement to Broadstreet API
   */
  async syncPlacementToBroadstreet(placement: IPlacement): Promise<PlacementSyncResult> {
    const result: PlacementSyncResult = {
      success: false
    };

    try {
      await connectDB();

      // Resolve campaign and zone IDs to Broadstreet IDs
      const campaignId = await this.resolveCampaignBroadstreetId(placement);
      const zoneId = await this.resolveZoneBroadstreetId(placement);

      if (!campaignId) {
        result.error = 'Campaign not synced to Broadstreet';
        result.code = 'DEPENDENCY';
        return result;
      }

      if (!zoneId) {
        result.error = 'Zone not synced to Broadstreet';
        result.code = 'DEPENDENCY';
        return result;
      }

      // Create placement in Broadstreet with rate limiting
      const broadstreetPlacement = await withRateLimit(
        () => broadstreetAPI.createPlacement({
          campaign_id: campaignId,
          advertisement_id: placement.advertisement_id,
          zone_id: zoneId,
          restrictions: placement.restrictions || []
        }),
        0, // Normal priority
        `create-placement-${placement._id}`
      );

      // Update local placement with sync status
      placement.synced_with_api = true;
      placement.synced_at = new Date();
      placement.sync_errors = [];
      await placement.save();

      result.success = true;
      result.placement = placement;
      result.broadstreetId = (broadstreetPlacement as any).id;

    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error';
      result.code = 'NETWORK';
      
      // Update placement with error
      if (!placement.sync_errors) {
        placement.sync_errors = [];
      }
      placement.sync_errors.push(result.error);
      await placement.save();
    }

    return result;
  }

  /**
   * Migrate embedded placements to local collection
   */
  async migrateEmbeddedPlacements(networkId: number): Promise<{
    migrated: number;
    errors: string[];
  }> {
    await connectDB();
    
    const migrationResult = {
      migrated: 0,
      errors: [] as string[]
    };

    try {
      // Find campaigns with embedded placements
      const campaignsWithPlacements = await LocalCampaign.find({
        network_id: networkId,
        placements: { $exists: true, $ne: [] }
      });

      for (const campaign of campaignsWithPlacements) {
        if (!campaign.placements || campaign.placements.length === 0) continue;

        for (const embeddedPlacement of campaign.placements) {
          try {
            // Check if placement already exists in collection
            const existingPlacement = await Placement.findOne({
              advertisement_id: embeddedPlacement.advertisement_id,
              zone_id: embeddedPlacement.zone_id,
              campaign_mongo_id: String(campaign._id)
            });

            if (existingPlacement) {
              continue; // Skip if already migrated
            }

            // Create placement in collection
            await this.createLocalPlacement({
              network_id: networkId,
              advertiser_id: campaign.advertiser_id as number,
              advertisement_id: embeddedPlacement.advertisement_id,
              campaign_mongo_id: String(campaign._id),
              zone_id: embeddedPlacement.zone_id,
              restrictions: embeddedPlacement.restrictions
            });

            migrationResult.migrated++;

          } catch (error) {
            migrationResult.errors.push(
              `Failed to migrate placement for campaign ${campaign.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        }
      }

    } catch (error) {
      migrationResult.errors.push(
        `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return migrationResult;
  }

  /**
   * Clean up synced placements from embedded storage
   */
  async cleanupSyncedEmbeddedPlacements(networkId: number): Promise<{
    cleaned: number;
    errors: string[];
  }> {
    await connectDB();
    
    const cleanupResult = {
      cleaned: 0,
      errors: [] as string[]
    };

    try {
      // Find synced campaigns with embedded placements
      const syncedCampaigns = await LocalCampaign.find({
        network_id: networkId,
        synced_with_api: true,
        original_broadstreet_id: { $exists: true },
        placements: { $exists: true, $ne: [] }
      });

      for (const campaign of syncedCampaigns) {
        if (!campaign.placements || campaign.placements.length === 0) continue;

        // Check if all placements are synced in collection
        const allPlacementsSynced = await Promise.all(
          campaign.placements.map(async (embeddedPlacement) => {
            const collectionPlacement = await Placement.findOne({
              advertisement_id: embeddedPlacement.advertisement_id,
              zone_id: embeddedPlacement.zone_id,
              campaign_id: campaign.original_broadstreet_id,
              synced_with_api: true
            });
            return !!collectionPlacement;
          })
        );

        if (allPlacementsSynced.every(synced => synced)) {
          // All placements are synced, safe to clean up embedded storage
          const placementCount = campaign.placements.length;
          campaign.placements = [];
          await campaign.save();
          cleanupResult.cleaned += placementCount;
        }
      }

    } catch (error) {
      cleanupResult.errors.push(
        `Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return cleanupResult;
  }

  /**
   * Get placements for a campaign (from both embedded and collection storage)
   */
  async getCampaignPlacements(campaignId: string | number): Promise<IPlacement[]> {
    await connectDB();
    
    const placements: IPlacement[] = [];

    // Get from collection storage
    const query = typeof campaignId === 'number' 
      ? { campaign_id: campaignId }
      : { campaign_mongo_id: campaignId };
    
    const collectionPlacements = await Placement.find(query);
    placements.push(...collectionPlacements);

    // Get from embedded storage (for backward compatibility)
    if (typeof campaignId === 'string') {
      const campaign = await LocalCampaign.findById(campaignId);
      if (campaign && campaign.placements) {
        // Convert embedded placements to IPlacement format
        const embeddedPlacements = campaign.placements.map(p => ({
          ...p,
          campaign_mongo_id: campaignId,
          created_locally: true,
          synced_with_api: false,
          _id: `embedded_${campaign._id}_${p.advertisement_id}_${p.zone_id}`
        })) as any[];
        
        // Filter out duplicates (prefer collection storage)
        const uniqueEmbedded = embeddedPlacements.filter(embedded => 
          !placements.some(collection => 
            collection.advertisement_id === embedded.advertisement_id &&
            collection.zone_id === embedded.zone_id
          )
        );
        
        placements.push(...uniqueEmbedded);
      }
    }

    return placements;
  }

  /**
   * Resolve campaign Broadstreet ID from placement
   */
  private async resolveCampaignBroadstreetId(placement: IPlacement): Promise<number | null> {
    if (placement.campaign_id) {
      return placement.campaign_id;
    }

    if (placement.campaign_mongo_id) {
      const campaign = await LocalCampaign.findById(placement.campaign_mongo_id);
      return campaign?.original_broadstreet_id || null;
    }

    return null;
  }

  /**
   * Resolve zone Broadstreet ID from placement
   */
  private async resolveZoneBroadstreetId(placement: IPlacement): Promise<number | null> {
    if (placement.zone_id) {
      return placement.zone_id;
    }

    if (placement.zone_mongo_id) {
      const zone = await LocalZone.findById(placement.zone_mongo_id);
      return zone?.original_broadstreet_id || null;
    }

    return null;
  }
}

export const placementService = new PlacementService();
