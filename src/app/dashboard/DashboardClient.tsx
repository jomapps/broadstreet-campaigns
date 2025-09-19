/**
 * DASHBOARD CLIENT - ZUSTAND INTEGRATION
 * 
 * Client component that initializes Zustand stores with server data
 * and renders the dashboard content. Follows the server-client pattern
 * outlined in zustand-implementation.md.
 * All variable names follow docs/variable-origins.md registry.
 */

'use client';

import { useEffect } from 'react';
import { useEntityStore, useFilterStore } from '@/stores';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { performanceMonitor } from '@/lib/utils/performance-monitor';
import DashboardContent from './DashboardContent';

/**
 * Props interface for DashboardClient
 * Variable names follow docs/variable-origins.md registry
 */
interface DashboardClientProps {
  initialNetworks: any[];
  initialAdvertisers: any[];
  initialZones: any[];
  initialCampaigns: any[];
  initialEntityCounts: any;
  searchParams: any;
}

/**
 * DashboardClient - Initializes Zustand stores and renders dashboard
 * Variable names follow docs/variable-origins.md registry
 */
export default function DashboardClient({ 
  initialNetworks,
  initialAdvertisers,
  initialZones,
  initialCampaigns,
  initialEntityCounts,
  searchParams 
}: DashboardClientProps) {
  // Get store actions using exact names from docs/variable-origins.md registry
  const { 
    setNetworks, 
    setAdvertisers, 
    setZones, 
    setCampaigns 
  } = useEntityStore();
  
  const { setFiltersFromParams } = useFilterStore();
  
  // Initialize store with server data on mount
  useEffect(() => {
    // Performance monitoring for store initialization
    performanceMonitor.start('dashboard-store-init');

    // Set entities using exact variable names from registry
    setNetworks(initialNetworks);
    setAdvertisers(initialAdvertisers);
    setZones(initialZones);
    setCampaigns(initialCampaigns);

    // Set filters from URL parameters if provided
    if (searchParams && Object.keys(searchParams).length > 0) {
      setFiltersFromParams(searchParams);
    }

    performanceMonitor.end('dashboard-store-init');
  }, [
    initialNetworks,
    initialAdvertisers,
    initialZones,
    initialCampaigns,
    searchParams,
    setNetworks,
    setAdvertisers,
    setZones,
    setCampaigns,
    setFiltersFromParams
  ]);

  // Render the dashboard content component with error boundary
  // The content will read from Zustand stores instead of props
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Dashboard Error:', error, errorInfo);
        performanceMonitor.start('dashboard-error-recovery');
      }}
    >
      <DashboardContent entityCounts={initialEntityCounts} />
    </ErrorBoundary>
  );
}
