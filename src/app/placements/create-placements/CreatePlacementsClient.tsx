'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEntityStore, useAllFilters } from '@/stores';
import { getEntityId } from '@/lib/utils/entity-helpers';
import { categorizePlacementsBySize, validatePlacementCategories, getPlacementsForCreation } from '@/lib/utils/placement-categorization';
import type { CategorizedPlacements } from '@/lib/utils/placement-categorization';
import ValidationCard from './ValidationCard';
import PlacementCategoryCards from './PlacementCategoryCards';
import CreationButtons from './CreationButtons';

interface CreatePlacementsClientProps {
  initialData: {
    networks: any[];
    advertisers: any[];
    campaigns: any[];
    zones: any[];
    advertisements: any[];
  };
  searchParams: any;
}

export default function CreatePlacementsClient({ 
  initialData, 
  searchParams 
}: CreatePlacementsClientProps) {
  const router = useRouter();
  const { setNetworks, setAdvertisers, setCampaigns, setZones, setAdvertisements } = useEntityStore();
  const { selectedNetwork, selectedAdvertiser, selectedCampaign, selectedZones, selectedAdvertisements } = useAllFilters();
  
  const [placementCategories, setPlacementCategories] = useState<CategorizedPlacements | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize store with server data
  useEffect(() => {
    setNetworks(initialData.networks);
    setAdvertisers(initialData.advertisers);
    setCampaigns(initialData.campaigns);
    setZones(initialData.zones);
    setAdvertisements(initialData.advertisements);
  }, [initialData, setNetworks, setAdvertisers, setCampaigns, setZones, setAdvertisements]);

  // Check if all required selections are present
  const hasRequiredSelections = () => Boolean(
    selectedNetwork && 
    selectedAdvertiser && 
    selectedCampaign && 
    selectedZones.length > 0 && 
    selectedAdvertisements.length > 0
  );

  // Get missing criteria for validation display
  const getMissingCriteria = () => {
    const missing: string[] = [];
    if (!selectedNetwork) missing.push('Network');
    if (!selectedAdvertiser) missing.push('Advertiser');
    if (!selectedCampaign) missing.push('Campaign');
    if (selectedZones.length === 0) missing.push('Zones (at least 1)');
    if (selectedAdvertisements.length === 0) missing.push('Advertisements (at least 1)');
    return missing;
  };

  // Get selected entity objects for processing
  const getSelectedZoneEntities = () => {
    return initialData.zones.filter(zone => {
      const zoneId = getEntityId(zone);
      // Convert both to strings for consistent comparison (localStorage serializes numbers to strings)
      return selectedZones.map(String).includes(String(zoneId));
    });
  };

  const getSelectedAdvertisementEntities = () => {
    return initialData.advertisements.filter(advertisement => {
      const adId = getEntityId(advertisement);
      // Convert both to strings for consistent comparison (localStorage serializes numbers to strings)
      return selectedAdvertisements.map(String).includes(String(adId));
    });
  };

  // Generate placement categories when selections change
  useEffect(() => {
    if (hasRequiredSelections()) {
      try {
        const selectedZoneEntities = getSelectedZoneEntities();
        const selectedAdvertisementEntities = getSelectedAdvertisementEntities();

        const categories = categorizePlacementsBySize(
          selectedZoneEntities,
          selectedAdvertisementEntities
        );

        const validation = validatePlacementCategories(categories);

        setPlacementCategories(categories);
        setValidationResult(validation);
        setError(null);
      } catch (err) {
        console.error('Error categorizing placements:', err);
        setError(err instanceof Error ? err.message : 'Failed to categorize placements');
        setPlacementCategories(null);
        setValidationResult(null);
      }
    } else {
      setPlacementCategories(null);
      setValidationResult(null);
      setError(null);
    }
  }, [selectedNetwork, selectedAdvertiser, selectedCampaign, selectedZones, selectedAdvertisements, initialData]);

  // Handle placement creation
  const handleCreatePlacements = async (includeIgnored: boolean) => {
    if (!placementCategories || !selectedCampaign) return;

    setIsCreating(true);
    setError(null);

    try {
      const placementsToCreate = getPlacementsForCreation(placementCategories, includeIgnored);

      if (placementsToCreate.length === 0) {
        throw new Error('No placements to create');
      }

      // Extract unique advertisement and zone IDs from selected combinations
      const advertisementIds = [...new Set(placementsToCreate.map(p => p.advertisement.id))];
      const zoneIds = [...new Set(placementsToCreate.map(p => p.zone.id))];

      // Get campaign ID for API payload
      const campaignId = getEntityId(selectedCampaign);

      // Prepare API payload - the API creates all combinations of ads × zones
      const payload: any = {
        advertisement_ids: advertisementIds,
        zone_ids: zoneIds,
      };

      // Set campaign reference (XOR constraint)
      if (typeof campaignId === 'number') {
        payload.campaign_broadstreet_id = campaignId;
      } else {
        payload.campaign_mongo_id = campaignId;
      }

      const response = await fetch('/api/create/placements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create placements');
      }

      // Success - redirect to placements page
      router.push('/placements');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create placements');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Validation Card */}
      <ValidationCard
        hasRequiredSelections={hasRequiredSelections()}
        missingCriteria={getMissingCriteria()}
        validationResult={validationResult}
        error={error}
      />

      {/* Placement Categories */}
      {placementCategories && (
        <>
          <PlacementCategoryCards categories={placementCategories} />
          
          <CreationButtons
            categories={placementCategories}
            onCreateWithIgnored={() => handleCreatePlacements(true)}
            onCreateWithoutIgnored={() => handleCreatePlacements(false)}
            isCreating={isCreating}
            disabled={!validationResult?.valid}
          />
        </>
      )}
    </div>
  );
}
