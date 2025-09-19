/**
 * ADVERTISEMENTS CLIENT - ZUSTAND INTEGRATION
 * 
 * Client component that initializes Zustand stores with server data
 * and renders the advertisements content. Follows the server-client pattern
 * established in Phase 2 (Dashboard, Networks, Advertisers, Zones, Campaigns).
 * All variable names follow docs/variable-origins.md registry.
 */

'use client';

import { useEffect } from 'react';
import { useEntityStore, useFilterStore } from '@/stores';
import AdvertisementsContent from './AdvertisementsContent';

/**
 * Props interface for AdvertisementsClient
 * Variable names follow docs/variable-origins.md registry
 */
interface AdvertisementsClientProps {
  initialAdvertisements: any[];
  initialNetworks: any[];
  initialAdvertisers: any[];
  searchParams: any;
}

/**
 * AdvertisementsClient - Initializes Zustand stores and renders advertisements content
 * Variable names follow docs/variable-origins.md registry
 */
export default function AdvertisementsClient({ 
  initialAdvertisements,
  initialNetworks,
  initialAdvertisers,
  searchParams 
}: AdvertisementsClientProps) {
  // Get store actions using exact names from docs/variable-origins.md registry
  const { setAdvertisements, setNetworks, setAdvertisers } = useEntityStore();
  const { setFiltersFromParams } = useFilterStore();
  
  // Initialize store with server data on mount
  useEffect(() => {
    // Set entities using exact variable names from registry
    setAdvertisements(initialAdvertisements);
    setNetworks(initialNetworks);
    setAdvertisers(initialAdvertisers);
    
    // Set filters from URL parameters if provided
    if (searchParams && Object.keys(searchParams).length > 0) {
      setFiltersFromParams(searchParams);
    }
  }, [
    initialAdvertisements,
    initialNetworks,
    initialAdvertisers,
    searchParams,
    setAdvertisements,
    setNetworks,
    setAdvertisers,
    setFiltersFromParams
  ]);
  
  // Render the advertisements content component
  // The content will read from Zustand stores instead of props
  return <AdvertisementsContent />;
}
