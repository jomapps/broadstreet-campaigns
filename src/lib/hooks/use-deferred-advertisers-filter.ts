/**
 * DEFERRED ADVERTISERS FILTER HOOK
 * 
 * Custom hook that provides deferred filtering for advertisers to improve performance
 * with large datasets. Uses React's useTransition to provide loading states during
 * expensive filtering operations.
 * All variable names follow docs/variable-origins.md registry.
 */

import { useMemo, useTransition, useEffect, useState } from 'react';

/**
 * Interface for filter parameters
 * Variable names follow docs/variable-origins.md registry
 */
interface FilterParams {
  advertisers: any[];
  searchTerm: string;
}

/**
 * Interface for hook return value
 * Variable names follow docs/variable-origins.md registry
 */
interface UseDeferredAdvertisersFilterReturn {
  filteredAdvertisers: any[];
  isFiltering: boolean;
  filterCount: number;
}

/**
 * Core filtering logic extracted for reusability
 * Variable names follow docs/variable-origins.md registry
 */
const applyAdvertiserFilters = (params: FilterParams): any[] => {
  const { advertisers, searchTerm } = params;

  if (!advertisers || !Array.isArray(advertisers)) {
    return [];
  }

  // If no search term, return all advertisers
  if (!searchTerm.trim()) {
    return advertisers;
  }

  // Apply search filter
  return advertisers.filter(advertiser =>
    advertiser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (advertiser.web_home_url && advertiser.web_home_url.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (advertiser.notes && advertiser.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (advertiser.admins && advertiser.admins.some((admin: any) => 
      admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchTerm.toLowerCase())
    ))
  );
};

/**
 * Custom hook for deferred advertisers filtering with loading states
 * Variable names follow docs/variable-origins.md registry
 */
export function useDeferredAdvertisersFilter(params: FilterParams): UseDeferredAdvertisersFilterReturn {
  const [isPending, startTransition] = useTransition();
  const [filteredAdvertisers, setFilteredAdvertisers] = useState<any[]>([]);
  const [filterCount, setFilterCount] = useState(0);

  // Memoize the filter parameters to prevent unnecessary re-renders
  const stableParams = useMemo(() => ({
    advertisers: params.advertisers,
    searchTerm: params.searchTerm
  }), [
    params.advertisers?.length,
    params.searchTerm
  ]);

  // Apply filtering only when stable params change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      startTransition(() => {
        const result = applyAdvertiserFilters(stableParams);
        setFilteredAdvertisers(result);
        setFilterCount(result.length);
      });
    }, 150); // Debounce for stability

    return () => clearTimeout(timeoutId);
  }, [stableParams]);

  return {
    filteredAdvertisers,
    isFiltering: isPending,
    filterCount
  };
}
