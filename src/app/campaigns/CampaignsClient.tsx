/**
 * CAMPAIGNS CLIENT - ZUSTAND INTEGRATION
 * 
 * Client component that initializes Zustand stores with server data
 * and renders the campaigns content. Follows the server-client pattern
 * established in Phase 2 (Dashboard, Networks, Advertisers, Zones).
 * All variable names follow docs/variable-origins.md registry.
 */

'use client';

import { useEffect } from 'react';
import { useEntityStore, useFilterStore } from '@/stores';
import CampaignsContent from './CampaignsContent';

/**
 * Props interface for CampaignsClient
 * Variable names follow docs/variable-origins.md registry
 */
interface CampaignsClientProps {
  initialCampaigns: any[];
  initialNetworks: any[];
  initialAdvertisers: any[];
  searchParams: any;
}

/**
 * CampaignsClient - Initializes Zustand stores and renders campaigns content
 * Variable names follow docs/variable-origins.md registry
 */
export default function CampaignsClient({ 
  initialCampaigns,
  initialNetworks,
  initialAdvertisers,
  searchParams 
}: CampaignsClientProps) {
  // Get store actions using exact names from docs/variable-origins.md registry
  const { setCampaigns, setNetworks, setAdvertisers } = useEntityStore();
  const { setFiltersFromParams } = useFilterStore();
  
  // Initialize store with server data on mount
  useEffect(() => {
    // Set entities using exact variable names from registry
    setCampaigns(initialCampaigns);
    setNetworks(initialNetworks);
    setAdvertisers(initialAdvertisers);
    
    // Set filters from URL parameters if provided
    if (searchParams && Object.keys(searchParams).length > 0) {
      setFiltersFromParams(searchParams);
    }
  }, [
    initialCampaigns,
    initialNetworks,
    initialAdvertisers,
    searchParams,
    setCampaigns,
    setNetworks,
    setAdvertisers,
    setFiltersFromParams
  ]);
  
  // Render the campaigns content component
  // The content will read from Zustand stores instead of props
  return <CampaignsContent />;
}
