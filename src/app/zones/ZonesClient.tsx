/**
 * ZONES CLIENT - ZUSTAND INTEGRATION
 * 
 * Client component that initializes Zustand stores with server data
 * and renders the zones content. Follows the server-client pattern
 * established in Phase 2 (Dashboard, Networks, Advertisers).
 * All variable names follow docs/variable-origins.md registry.
 */

'use client';

import { useEffect } from 'react';
import { useEntityStore, useFilterStore } from '@/stores';
import ZonesContent from './ZonesContent';

/**
 * Props interface for ZonesClient
 * Variable names follow docs/variable-origins.md registry
 */
interface ZonesClientProps {
  initialZones: any[];
  initialNetworks: any[];
  searchParams: any;
}

/**
 * ZonesClient - Initializes Zustand stores and renders zones content
 * Variable names follow docs/variable-origins.md registry
 */
export default function ZonesClient({ 
  initialZones,
  initialNetworks,
  searchParams 
}: ZonesClientProps) {
  // Get store actions using exact names from docs/variable-origins.md registry
  const { setZones, setNetworks } = useEntityStore();
  const { setFiltersFromParams } = useFilterStore();
  
  // Initialize store with server data on mount
  useEffect(() => {
    // Set entities using exact variable names from registry
    setZones(initialZones);
    setNetworks(initialNetworks);
    
    // Set filters from URL parameters if provided
    if (searchParams && Object.keys(searchParams).length > 0) {
      setFiltersFromParams(searchParams);
    }
  }, [
    initialZones,
    initialNetworks,
    searchParams,
    setZones,
    setNetworks,
    setFiltersFromParams
  ]);
  
  // Render the zones content component
  // The content will read from Zustand stores instead of props
  return <ZonesContent />;
}
