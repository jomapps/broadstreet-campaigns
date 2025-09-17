import { useState, useMemo } from 'react';
import { useSelectedEntities } from '@/lib/hooks/use-selected-entities';

interface UseLocalPlacementCreationResult {
  // Computed values
  networkId: number | undefined;
  advertiserId: number | undefined;
  campaignId: number | undefined;
  campaignMongoId: string | undefined;
  adIds: number[];
  zoneIds: number[];
  zoneMongoIds: string[];
  adCount: number;
  zoneCount: number;
  combinationsCount: number;

  // State
  isSubmitting: boolean;
  error: string | null;
  successMessage: string | null;

  // Actions
  createLocalPlacements: () => Promise<void>;
  clearMessages: () => void;
}

export function useLocalPlacementCreation(): UseLocalPlacementCreationResult {
  const entities = useSelectedEntities();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Extract entity IDs
  const networkId = useMemo(() => entities.network?.ids.broadstreet_id, [entities.network]);
  const advertiserId = useMemo(() => entities.advertiser?.ids.broadstreet_id, [entities.advertiser]);
  const campaignId = useMemo(() => entities.campaign?.ids.broadstreet_id, [entities.campaign]);
  const campaignMongoId = useMemo(() => entities.campaign?.ids.mongo_id, [entities.campaign]);

  const toNumericIds = (items: { ids: { broadstreet_id?: number } }[]) =>
    items
      .map((x) => x.ids.broadstreet_id)
      .filter((broadstreetId): broadstreetId is number => typeof broadstreetId === 'number');

  const adIds = useMemo(() => toNumericIds(entities.advertisements as any), [entities.advertisements]);

  const zoneIds = useMemo(() => toNumericIds(entities.zones as any), [entities.zones]);
  const zoneMongoIds = useMemo(
    () => (entities.zones as any)
      .map((z: any) => (typeof z?.ids?.mongo_id === 'string' ? z.ids.mongo_id : null))
      .filter((v: string | null): v is string => typeof v === 'string'),
    [entities.zones]
  );

  // Counts
  const adCount = adIds.length;
  const zoneCount = entities.zones.length;
  const combinationsCount = useMemo(() => adIds.length * entities.zones.length, [adIds.length, entities.zones.length]);

  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };

  const createLocalPlacements = async () => {
    if (!entities.campaign || !entities.network || !entities.advertiser) {
      setError('Network, advertiser, and campaign must be selected');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Validate required fields
      if (!networkId) {
        throw new Error('Network ID is required');
      }
      if (!advertiserId) {
        throw new Error('Advertiser ID is required');
      }
      if (adIds.length === 0) {
        throw new Error('Select at least one advertisement');
      }
      if (entities.zones.length === 0) {
        throw new Error('Select at least one zone');
      }

      // Validate campaign ID (either broadstreet or mongo)
      if (!campaignId && !campaignMongoId) {
        throw new Error('Campaign ID validation failed: neither campaign_id nor campaign_mongo_id is available');
      }

      // Create placements for each advertisement-zone combination
      const placementPromises = [];
      
      for (const advertisementId of adIds) {
        // Create placements with Broadstreet zones
        for (const zoneId of zoneIds) {
          const placementData = {
            network_id: networkId,
            advertiser_id: advertiserId,
            advertisement_id: advertisementId,
            zone_id: zoneId,
            ...(campaignId && { campaign_id: campaignId }),
            ...(campaignMongoId && { campaign_mongo_id: campaignMongoId }),
          };

          placementPromises.push(
            fetch('/api/local-placements', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(placementData),
            })
          );
        }

        // Create placements with local zones
        for (const zoneMongoId of zoneMongoIds) {
          const placementData = {
            network_id: networkId,
            advertiser_id: advertiserId,
            advertisement_id: advertisementId,
            zone_mongo_id: zoneMongoId,
            ...(campaignId && { campaign_id: campaignId }),
            ...(campaignMongoId && { campaign_mongo_id: campaignMongoId }),
          };

          placementPromises.push(
            fetch('/api/local-placements', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(placementData),
            })
          );
        }
      }

      // Execute all placement creation requests
      const responses = await Promise.allSettled(placementPromises);
      
      // Count successes and failures
      let successCount = 0;
      let duplicateCount = 0;
      const errors: string[] = [];

      for (const response of responses) {
        if (response.status === 'fulfilled') {
          if (response.value.ok) {
            successCount++;
          } else {
            const errorData = await response.value.json();
            if (response.value.status === 409) {
              duplicateCount++;
            } else {
              errors.push(errorData.error || 'Unknown error');
            }
          }
        } else {
          errors.push(response.reason?.message || 'Network error');
        }
      }

      // Build success message
      let message = `Created ${successCount} local placements`;
      if (duplicateCount > 0) {
        message += ` (${duplicateCount} duplicates skipped)`;
      }
      if (errors.length > 0) {
        message += ` (${errors.length} errors)`;
      }

      setSuccessMessage(message);

      // Show errors if any
      if (errors.length > 0) {
        console.error('Placement creation errors:', errors);
        setError(`Some placements failed: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`);
      }

      // Navigate to placements page after success
      if (successCount > 0) {
        setTimeout(() => {
          window.location.href = '/placements';
        }, 1000);
      }

    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    networkId,
    advertiserId,
    campaignId,
    campaignMongoId,
    adIds,
    zoneIds,
    zoneMongoIds,
    adCount,
    zoneCount,
    combinationsCount,
    isSubmitting,
    error,
    successMessage,
    createLocalPlacements,
    clearMessages,
  };
}
