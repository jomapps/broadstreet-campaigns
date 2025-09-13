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

  const campaignMongoId = useMemo(() => {
    if (!entities.campaign) return undefined;
    return typeof entities.campaign.id === 'string' ? entities.campaign.id : undefined;
  }, [entities.campaign]);

  const toNumericIds = (items: { id: string }[]) =>
    items
      .map((x) => x.id)
      .filter((id) => /^\d+$/.test(id))
      .map((id) => Number(id));

  const adIds = useMemo(() => toNumericIds(entities.advertisements), [entities.advertisements]);

  const zoneIds = useMemo(() => toNumericIds(entities.zones), [entities.zones]);

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
        advertisement_ids: adIds.length > 0 ? adIds : entities.advertisements.map((ad) => ad.id),
        zone_ids: zoneIds.length > 0 ? zoneIds : entities.zones.map((zone) => zone.id),
      };

      // Validate that we have either campaign_mongo_id or campaign_id
      let hasValidCampaignId = false;
      if (campaignMongoId) {
        payload.campaign_mongo_id = campaignMongoId;
        hasValidCampaignId = true;
      } else if (typeof entities.campaign.id === 'number') {
        payload.campaign_id = entities.campaign.id;
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
