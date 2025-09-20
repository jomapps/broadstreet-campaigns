/**
 * DEFERRED CAMPAIGNS FILTER HOOK
 * 
 * Custom hook that provides deferred filtering for campaigns to improve performance
 * with large datasets. Uses React's useTransition to provide loading states during
 * expensive filtering operations.
 * All variable names follow docs/variable-origins.md registry.
 */

import { useMemo, useTransition, useEffect, useState } from 'react';
import { getEntityId } from '@/lib/utils/entity-helpers';

/**
 * Interface for filter parameters
 * Variable names follow docs/variable-origins.md registry
 */
interface FilterParams {
  campaigns: any[];
  selectedAdvertiser: any;
  searchTerm: string;
}

/**
 * Interface for hook return value
 * Variable names follow docs/variable-origins.md registry
 */
interface UseDeferredCampaignsFilterReturn {
  filteredCampaigns: any[];
  isFiltering: boolean;
  filterCount: number;
}

/**
 * Core filtering logic extracted for reusability
 * Variable names follow docs/variable-origins.md registry
 */
const applyCampaignFilters = (params: FilterParams): any[] => {
  const { campaigns, selectedAdvertiser, searchTerm } = params;

  if (!campaigns || !Array.isArray(campaigns)) {
    return [];
  }

  let filtered = campaigns;

  // 1. Apply advertiser filter
  if (selectedAdvertiser) {
    // If advertiser is selected, show only campaigns for that advertiser
    const advertiserId = getEntityId(selectedAdvertiser);
    filtered = filtered.filter(campaign => {
      return String(campaign.advertiser_id) === String(advertiserId);
    });
  }
  // If no advertiser is selected, show all campaigns for all advertisers

  // 2. Apply search filter if search term exists
  if (searchTerm.trim()) {
    filtered = filtered.filter(campaign => {
      const term = searchTerm.toLowerCase();
      const nameMatch = campaign.name.toLowerCase().includes(term);
      const notesMatch = (campaign.notes && campaign.notes.toLowerCase().includes(term)) || false;
      const idStr = String(getEntityId(campaign) ?? '');
      const idMatch = idStr.toLowerCase().includes(term);
      return nameMatch || notesMatch || idMatch;
    });
  }

  // 3. Sort campaigns: running campaigns first, then paused campaigns
  // Create a copy of the array before sorting to avoid mutating the original
  filtered = [...filtered].sort((a, b) => {
    // Determine if campaigns are running based on active field
    const aIsRunning = a.active;
    const bIsRunning = b.active;

    // Running campaigns come first
    if (aIsRunning && !bIsRunning) return -1;
    if (!aIsRunning && bIsRunning) return 1;

    // Within same status, sort by name
    return a.name.localeCompare(b.name);
  });

  return filtered;
};

/**
 * Custom hook for deferred campaigns filtering with loading states
 * Variable names follow docs/variable-origins.md registry
 */
export function useDeferredCampaignsFilter(params: FilterParams): UseDeferredCampaignsFilterReturn {
  const [isPending, startTransition] = useTransition();
  const [filteredCampaigns, setFilteredCampaigns] = useState<any[]>([]);
  const [filterCount, setFilterCount] = useState(0);

  // Memoize the filter parameters to prevent unnecessary re-renders
  const stableParams = useMemo(() => ({
    campaigns: params.campaigns,
    selectedAdvertiser: params.selectedAdvertiser,
    searchTerm: params.searchTerm
  }), [
    params.campaigns?.length,
    params.selectedAdvertiser?.broadstreet_id || params.selectedAdvertiser?.mongo_id,
    params.searchTerm
  ]);

  // Apply filtering only when stable params change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      startTransition(() => {
        const result = applyCampaignFilters(stableParams);
        setFilteredCampaigns(result);
        setFilterCount(result.length);
      });
    }, 150); // Debounce for stability

    return () => clearTimeout(timeoutId);
  }, [stableParams]);

  return {
    filteredCampaigns,
    isFiltering: isPending,
    filterCount
  };
}
