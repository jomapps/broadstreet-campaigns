/**
 * LOCAL-ONLY CLIENT - ZUSTAND INTEGRATION
 * 
 * Client component that initializes Zustand stores with server data
 * and renders the local-only dashboard. Follows the server-client pattern
 * outlined in zustand-implementation.md.
 * All variable names follow docs/variable-origins.md registry.
 */

'use client';

import { useEffect } from 'react';
import { useEntityStore, useFilterStore } from '@/stores';
import LocalOnlyDashboard from './LocalOnlyDashboard';

/**
 * Props interface for LocalOnlyClient
 * Variable names follow docs/variable-origins.md registry
 */
interface LocalOnlyClientProps {
  initialLocalEntities: {
    zones: any[];
    advertisers: any[];
    campaigns: any[];
    networks: any[];
    advertisements: any[];
    placements: any[];
  };
  initialNetworks: any[];
  searchParams: any;
}

/**
 * LocalOnlyClient - Initializes Zustand stores and renders dashboard
 * Variable names follow docs/variable-origins.md registry
 */
export default function LocalOnlyClient({ 
  initialLocalEntities, 
  initialNetworks,
  searchParams 
}: LocalOnlyClientProps) {
  // Get store actions using exact names from docs/variable-origins.md registry
  const { setLocalEntities, setNetworks } = useEntityStore();
  const { setFiltersFromParams } = useFilterStore();
  
  // Initialize store with server data on mount
  useEffect(() => {
    // Set local entities using exact variable names from registry
    setLocalEntities(initialLocalEntities);
    
    // Set networks using exact variable names from registry
    setNetworks(initialNetworks);
    
    // Set filters from URL parameters if provided
    if (searchParams && Object.keys(searchParams).length > 0) {
      setFiltersFromParams(searchParams);
    }
  }, [
    initialLocalEntities, 
    initialNetworks, 
    searchParams,
    setLocalEntities, 
    setNetworks, 
    setFiltersFromParams
  ]);
  
  // Render the dashboard component
  // The dashboard will read from Zustand stores instead of props
  return <LocalOnlyDashboard />;
}
