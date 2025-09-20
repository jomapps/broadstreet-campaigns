/**
 * PLACEMENTS CLIENT - ZUSTAND INTEGRATION
 * 
 * Client component that initializes Zustand stores with server data
 * and renders the placements content. Follows the server-client pattern
 * established in Phase 2 (Dashboard, Networks, Advertisers, Zones, Campaigns, Advertisements).
 * All variable names follow docs/variable-origins.md registry.
 */

'use client';

import { useEffect, useState } from 'react';
import { useEntityStore, useFilterStore, useAllFilters } from '@/stores';
import PlacementsContent from './PlacementsContent';

/**
 * Props interface for PlacementsClient
 * Variable names follow docs/variable-origins.md registry
 */
interface PlacementsClientProps {
  initialPlacements: any[];
  initialNetworks: any[];
  initialAdvertisers: any[];
  initialCampaigns: any[];
  searchParams: any;
}

/**
 * PlacementsClient - Initializes Zustand stores and renders placements content
 * Variable names follow docs/variable-origins.md registry
 */
export default function PlacementsClient({
  initialPlacements,
  initialNetworks,
  initialAdvertisers,
  initialCampaigns,
  searchParams
}: PlacementsClientProps) {
  // Get store actions using exact names from docs/variable-origins.md registry
  const { setPlacements, setNetworks, setAdvertisers, setCampaigns, setLoading } = useEntityStore();
  const { setFiltersFromParams } = useFilterStore();
  const { selectedNetwork, selectedAdvertiser, selectedCampaign } = useAllFilters();
  const [placementsLoaded, setPlacementsLoaded] = useState(false);

  // Initialize store with server data on mount
  useEffect(() => {
    // Set entities using exact variable names from registry (except placements)
    setNetworks(initialNetworks);
    setAdvertisers(initialAdvertisers);
    setCampaigns(initialCampaigns);

    // Set filters from URL parameters if provided
    if (searchParams && Object.keys(searchParams).length > 0) {
      setFiltersFromParams(searchParams);
    }
  }, [
    initialNetworks,
    initialAdvertisers,
    initialCampaigns,
    searchParams,
    setNetworks,
    setAdvertisers,
    setCampaigns,
    setFiltersFromParams
  ]);

  // Reset placements loaded flag when filters change
  useEffect(() => {
    setPlacementsLoaded(false);
  }, [selectedNetwork, selectedAdvertiser, selectedCampaign]);

  // Load enriched placements data client-side
  useEffect(() => {
    async function loadPlacements() {
      if (placementsLoaded) return;

      setLoading('placements', true);

      try {
        // Build query parameters from current filter state
        const queryParams = new URLSearchParams();
        if (selectedNetwork?.broadstreet_id) queryParams.set('network_id', selectedNetwork.broadstreet_id.toString());
        if (selectedAdvertiser?.broadstreet_id) queryParams.set('advertiser_id', selectedAdvertiser.broadstreet_id.toString());
        if (selectedCampaign?.broadstreet_id) queryParams.set('campaign_id', selectedCampaign.broadstreet_id.toString());

        // Also support campaign_mongo_id for local campaigns
        if (selectedCampaign?.mongo_id && !selectedCampaign?.broadstreet_id) {
          queryParams.set('campaign_mongo_id', selectedCampaign.mongo_id);
        }

        console.log('Loading placements with query:', queryParams.toString());
        const response = await fetch(`/api/placements?${queryParams.toString()}`);
        const data = await response.json();

        if (data.success && data.placements) {
          setPlacements(data.placements);
        } else {
          setPlacements([]);
        }

        setPlacementsLoaded(true);
      } catch (error) {
        console.error('Error loading placements:', error);
        setPlacements([]);
        setPlacementsLoaded(true);
      } finally {
        setLoading('placements', false);
      }
    }

    loadPlacements();
  }, [placementsLoaded, setPlacements, setLoading, selectedNetwork, selectedAdvertiser, selectedCampaign]);

  // Render the placements content component
  // The content will read from Zustand stores instead of props
  return <PlacementsContent />;
}
