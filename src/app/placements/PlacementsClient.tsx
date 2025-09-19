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
import { useEntityStore, useFilterStore } from '@/stores';
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

  // Load enriched placements data client-side
  useEffect(() => {
    async function loadPlacements() {
      if (placementsLoaded) return;

      setLoading('placements', true);

      try {
        // Build query parameters from searchParams
        const queryParams = new URLSearchParams();
        if (searchParams?.network) queryParams.set('network_id', searchParams.network);
        if (searchParams?.advertiser) queryParams.set('advertiser_id', searchParams.advertiser);
        if (searchParams?.campaign) queryParams.set('campaign_id', searchParams.campaign);
        if (searchParams?.status) queryParams.set('status', searchParams.status);
        if (searchParams?.zoneId) queryParams.set('zone_id', searchParams.zoneId);
        if (searchParams?.startDate) queryParams.set('start_date', searchParams.startDate);
        if (searchParams?.endDate) queryParams.set('end_date', searchParams.endDate);

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
  }, [searchParams, placementsLoaded, setPlacements, setLoading]);

  // Render the placements content component
  // The content will read from Zustand stores instead of props
  return <PlacementsContent />;
}
