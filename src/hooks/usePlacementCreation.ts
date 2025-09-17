import { useState, useMemo } from 'react';
import { useSelectedEntities } from '@/lib/hooks/use-selected-entities';

interface UsePlacementCreationResult {
  // Computed values
  campaignMongoId: string | undefined;
  adIds: number[];
  zoneIds: number[];
  adCount: number;
  zoneCount: number;
  combinationsCount: number;

  // State
  isSubmitting: boolean;
  error: string | null;
  successMessage: string | null;

  // Actions
  createPlacements: () => Promise<void>;
  clearMessages: () => void;
}

export function usePlacementCreation(): UsePlacementCreationResult {
  const entities = useSelectedEntities();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  // Fallback-aware counts to handle string ID selections
  const adCount = adIds.length;
  const zoneCount = entities.zones.length; // count total selected zones, including local

  const combinationsCount = useMemo(() => adIds.length * entities.zones.length, [adIds.length, entities.zones.length]);

  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };

  const createPlacements = async () => {
    if (!entities.campaign) return;

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Pre-validate numeric selections only
      if (adIds.length === 0) {
        throw new Error('Select at least one advertisement');
      }
      if (entities.zones.length === 0) {
        throw new Error('Select at least one zone');
      }

      const payload: any = {
        advertisement_ids: adIds,
        // Include both numeric Broadstreet zone IDs and local Mongo IDs
        zone_ids: [...zoneIds, ...zoneMongoIds],
      };

      // Validate that we have either campaign_mongo_id or campaign_broadstreet_id
      let hasValidCampaignId = false;
      if (campaignMongoId) {
        payload.campaign_mongo_id = campaignMongoId;
        hasValidCampaignId = true;
      } else if (typeof (entities.campaign as any)?.ids?.broadstreet_id === 'number') {
        payload.campaign_broadstreet_id = (entities.campaign as any).ids.broadstreet_id as number;
        hasValidCampaignId = true;
      }

      if (!hasValidCampaignId) {
        throw new Error('Campaign ID validation failed: neither campaign_mongo_id nor numeric campaign_id is available');
      }

      const res = await fetch('/api/create/placements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create placements');
      }

      const createdCount = typeof data?.created === 'number' ? data.created : combinationsCount;
      const totalSuffix = typeof data?.total === 'number' ? ` (total: ${data.total})` : '';
      setSuccessMessage(`Created ${createdCount} placements${totalSuffix}`);

      // Optional refresh - let the component handle navigation
      setTimeout(() => {
        window.location.href = '/placements';
      }, 500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    campaignMongoId,
    adIds,
    zoneIds,
    adCount,
    zoneCount,
    combinationsCount,
    isSubmitting,
    error,
    successMessage,
    createPlacements,
    clearMessages,
  };
}
