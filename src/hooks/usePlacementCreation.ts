import { useState, useMemo } from 'react';
import { useFilters } from '@/contexts/FilterContext';

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
  const { selectedCampaign, selectedZones, selectedAdvertisements } = useFilters();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const campaignMongoId = useMemo(() => {
    // Derive campaign_mongo_id from selectedCampaign._id directly
    if (!selectedCampaign) return undefined;
    // If selectedCampaign has _id field (MongoDB ObjectId), use it
    if ((selectedCampaign as any)._id) {
      return (selectedCampaign as any)._id as string;
    }
    return undefined;
  }, [selectedCampaign]);

  const adIds = useMemo(() => {
    // Parse selection values that may be numeric strings
    return selectedAdvertisements
      .map((v) => parseInt(v, 10))
      .filter((v) => Number.isFinite(v));
  }, [selectedAdvertisements]);

  const zoneIds = useMemo(() => {
    return selectedZones
      .map((v) => parseInt(v, 10))
      .filter((v) => Number.isFinite(v));
  }, [selectedZones]);

  // Fallback-aware counts to handle string ID selections
  const adCount = adIds.length > 0 ? adIds.length : selectedAdvertisements.length;
  const zoneCount = zoneIds.length > 0 ? zoneIds.length : selectedZones.length;

  const combinationsCount = useMemo(() => adCount * zoneCount, [adCount, zoneCount]);

  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };

  const createPlacements = async () => {
    if (!selectedCampaign) return;

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const payload: any = {
        advertisement_ids: adIds.length > 0 ? adIds : selectedAdvertisements,
        zone_ids: zoneIds.length > 0 ? zoneIds : selectedZones,
      };

      // Validate that we have either campaign_mongo_id or campaign_id
      let hasValidCampaignId = false;
      if (campaignMongoId) {
        payload.campaign_mongo_id = campaignMongoId;
        hasValidCampaignId = true;
      } else if (typeof selectedCampaign.id === 'number') {
        payload.campaign_id = selectedCampaign.id;
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
