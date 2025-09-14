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
      .filter((id): id is number => typeof id === 'number');

  const adIds = useMemo(() => toNumericIds(entities.advertisements as any), [entities.advertisements]);

  const zoneIds = useMemo(() => toNumericIds(entities.zones as any), [entities.zones]);

  // Fallback-aware counts to handle string ID selections
  const adCount = adIds.length > 0 ? adIds.length : entities.advertisements.length;
  const zoneCount = zoneIds.length > 0 ? zoneIds.length : entities.zones.length;

  const combinationsCount = useMemo(() => adCount * zoneCount, [adCount, zoneCount]);

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
      const payload: any = {
        advertisement_ids: adIds.length > 0 ? adIds : (entities.advertisements as any).map((ad: any) => ad.ids.broadstreet_id).filter((n: any) => typeof n === 'number'),
        zone_ids: zoneIds.length > 0 ? zoneIds : (entities.zones as any).map((zone: any) => zone.ids.broadstreet_id).filter((n: any) => typeof n === 'number'),
      };

      // Validate that we have either campaign_mongo_id or campaign_id
      let hasValidCampaignId = false;
      if (campaignMongoId) {
        payload.campaign_mongo_id = campaignMongoId;
        hasValidCampaignId = true;
      } else if (typeof (entities.campaign as any)?.ids?.broadstreet_id === 'number') {
        payload.campaign_id = (entities.campaign as any).ids.broadstreet_id as number;
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
