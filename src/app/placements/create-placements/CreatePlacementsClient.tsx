'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEntityStore, useAllFilters } from '@/stores';
import { getEntityId } from '@/lib/utils/entity-helpers';
import { categorizePlacementsBySize, getPlacementsForCreation } from '@/lib/utils/placement-categorization';
import type { CategorizedPlacements } from '@/lib/utils/placement-categorization';
import RequiredEntitiesCard from './RequiredEntitiesCard';
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
}

export default function CreatePlacementsClient({
  initialData
}: CreatePlacementsClientProps) {
  const router = useRouter();
  const { setNetworks, setAdvertisers, setCampaigns, setZones, setAdvertisements } = useEntityStore();
  const { selectedNetwork, selectedAdvertiser, selectedCampaign, selectedZones, selectedAdvertisements } = useAllFilters();
  
  const [placementCategories, setPlacementCategories] = useState<CategorizedPlacements | null>(null);
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

        setPlacementCategories(categories);
        setError(null);
      } catch (err) {
        console.error('Error categorizing placements:', err);
        setError(err instanceof Error ? err.message : 'Failed to categorize placements');
        setPlacementCategories(null);
      }
    } else {
      setPlacementCategories(null);
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

      // Get campaign ID for API payload
      const campaignId = getEntityId(selectedCampaign);

      // Prepare API payload - send exact placement combinations instead of unique IDs
      const payload: any = {
        placements: placementsToCreate.map(p => ({
          advertisementId: p.advertisement.id,
          zoneId: p.zone.id
        }))
      };

      // Set campaign reference (XOR constraint)
      if (typeof campaignId === 'number') {
        payload.campaignId = campaignId;
      } else {
        payload.campaignMongoId = campaignId as string;
      }

      console.log('Creating placements with payload:', payload);
      console.log('Placements to create count:', placementsToCreate.length);
      console.log('Include ignored:', includeIgnored);
      console.log('Selected campaign:', selectedCampaign);
      console.log('Campaign ID:', campaignId, 'Type:', typeof campaignId);

      const response = await fetch('/api/create/placements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('API Response status:', response.status);
      console.log('API Response ok:', response.ok);

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
      {/* Required Entities Card */}
      <RequiredEntitiesCard
        hasRequiredSelections={hasRequiredSelections()}
        missingCriteria={getMissingCriteria()}
        selectedNetwork={selectedNetwork}
        selectedAdvertiser={selectedAdvertiser}
        selectedCampaign={selectedCampaign}
        selectedZones={selectedZones}
        selectedAdvertisements={selectedAdvertisements}
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
            disabled={false}
          />
        </>
      )}
    </div>
  );
}
