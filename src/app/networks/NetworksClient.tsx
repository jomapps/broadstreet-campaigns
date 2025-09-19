/**
 * NETWORKS CLIENT - ZUSTAND INTEGRATION
 * 
 * Client component that initializes Zustand stores with server data
 * and renders the networks content. Follows the server-client pattern
 * outlined in zustand-implementation.md.
 * All variable names follow docs/variable-origins.md registry.
 */

'use client';

import { useEffect } from 'react';
import { useEntityStore, useFilterStore } from '@/stores';
import NetworksContent from './NetworksContent';

/**
 * Props interface for NetworksClient
 * Variable names follow docs/variable-origins.md registry
 */
interface NetworksClientProps {
  initialNetworks: any[];
  searchParams: any;
}

/**
 * NetworksClient - Initializes Zustand stores and renders networks
 * Variable names follow docs/variable-origins.md registry
 */
export default function NetworksClient({ 
  initialNetworks,
  searchParams 
}: NetworksClientProps) {
  // Get store actions using exact names from docs/variable-origins.md registry
  const { setNetworks } = useEntityStore();
  const { setFiltersFromParams } = useFilterStore();
  
  // Initialize store with server data on mount
  useEffect(() => {
    // Set networks using exact variable names from registry
    setNetworks(initialNetworks);
    
    // Set filters from URL parameters if provided
    if (searchParams && Object.keys(searchParams).length > 0) {
      setFiltersFromParams(searchParams);
    }
  }, [
    initialNetworks,
    searchParams,
    setNetworks,
    setFiltersFromParams
  ]);
  
  // Render the networks content component
  // The content will read from Zustand stores instead of props
  return <NetworksContent />;
}
