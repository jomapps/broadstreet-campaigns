/**
 * PLACEMENTS CLIENT - ZUSTAND INTEGRATION
 * 
 * Client component that initializes Zustand stores with server data
 * and renders the placements content. Follows the server-client pattern
 * established in Phase 2 (Dashboard, Networks, Advertisers, Zones, Campaigns, Advertisements).
 * All variable names follow docs/variable-origins.md registry.
 */

'use client';

import { useEffect } from 'react';
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
  const { setPlacements, setNetworks, setAdvertisers, setCampaigns } = useEntityStore();
  const { setFiltersFromParams } = useFilterStore();
  
  // Initialize store with server data on mount
  useEffect(() => {
    // Set entities using exact variable names from registry
    setPlacements(initialPlacements);
    setNetworks(initialNetworks);
    setAdvertisers(initialAdvertisers);
    setCampaigns(initialCampaigns);
    
    // Set filters from URL parameters if provided
    if (searchParams && Object.keys(searchParams).length > 0) {
      setFiltersFromParams(searchParams);
    }
  }, [
    initialPlacements,
    initialNetworks,
    initialAdvertisers,
    initialCampaigns,
    searchParams,
    setPlacements,
    setNetworks,
    setAdvertisers,
    setCampaigns,
    setFiltersFromParams
  ]);
  
  // Render the placements content component
  // The content will read from Zustand stores instead of props
  return <PlacementsContent />;
}
