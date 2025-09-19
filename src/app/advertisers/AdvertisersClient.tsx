/**
 * ADVERTISERS CLIENT - ZUSTAND INTEGRATION
 * 
 * Client component that initializes Zustand stores with server data
 * and renders the advertisers content. Follows the server-client pattern
 * outlined in zustand-implementation.md.
 * All variable names follow docs/variable-origins.md registry.
 */

'use client';

import { useEffect } from 'react';
import { useEntityStore, useFilterStore } from '@/stores';
import AdvertisersContent from './AdvertisersContent';

/**
 * Props interface for AdvertisersClient
 * Variable names follow docs/variable-origins.md registry
 */
interface AdvertisersClientProps {
  initialAdvertisers: any[];
  initialNetworks: any[];
  searchParams: any;
}

/**
 * AdvertisersClient - Initializes Zustand stores and renders advertisers
 * Variable names follow docs/variable-origins.md registry
 */
export default function AdvertisersClient({ 
  initialAdvertisers,
  initialNetworks,
  searchParams 
}: AdvertisersClientProps) {
  // Get store actions using exact names from docs/variable-origins.md registry
  const { setAdvertisers, setNetworks } = useEntityStore();
  const { setFiltersFromParams } = useFilterStore();
  
  // Initialize store with server data on mount
  useEffect(() => {
    // Set entities using exact variable names from registry
    setAdvertisers(initialAdvertisers);
    setNetworks(initialNetworks);
    
    // Set filters from URL parameters if provided
    if (searchParams && Object.keys(searchParams).length > 0) {
      setFiltersFromParams(searchParams);
    }
  }, [
    initialAdvertisers,
    initialNetworks,
    searchParams,
    setAdvertisers,
    setNetworks,
    setFiltersFromParams
  ]);
  
  // Render the advertisers content component
  // The content will read from Zustand stores instead of props
  return <AdvertisersContent />;
}
