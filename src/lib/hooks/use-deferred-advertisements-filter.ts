/**
 * DEFERRED ADVERTISEMENTS FILTER HOOK
 * 
 * Custom hook that provides deferred filtering for advertisements to improve performance
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
  advertisements: any[];
  selectedAdvertisements: Array<string | number>;
  showOnlySelectedAds: boolean;
  selectedTypes: string[];
  showActiveOnly: boolean;
  searchTerm: string;
  entities: any;
}

/**
 * Interface for hook return value
 * Variable names follow docs/variable-origins.md registry
 */
interface UseDeferredAdvertisementsFilterReturn {
  filteredAdvertisements: any[];
  isFiltering: boolean;
  filterCount: number;
}

/**
 * Core filtering logic extracted for reusability
 * Variable names follow docs/variable-origins.md registry
 */
const applyAdvertisementFilters = (params: FilterParams): any[] => {
  const {
    advertisements,
    selectedAdvertisements,
    showOnlySelectedAds,
    selectedTypes,
    showActiveOnly,
    searchTerm,
    entities
  } = params;

  if (!advertisements || !Array.isArray(advertisements)) {
    return [];
  }

  let filtered = advertisements;

  // 1. Filter by selected advertiser (highest priority)
  const advertiserName = entities.advertiser?.name;
  if (advertiserName) {
    filtered = filtered.filter(ad => ad.advertiser === advertiserName);
  }

  // 2. Apply "Only Selected" filter
  if (showOnlySelectedAds && selectedAdvertisements.length > 0) {
    const selectedSet = new Set(selectedAdvertisements.map(x => String(x)));
    filtered = filtered.filter(ad => selectedSet.has(String(getEntityId(ad))));
  }

  // 3. Apply type filters
  if (selectedTypes.length > 0) {
    filtered = filtered.filter(ad => selectedTypes.includes(ad.type));
  }

  // 4. Apply active status filter
  if (showActiveOnly) {
    filtered = filtered.filter(ad => ad.active_placement);
  }

  // 5. Apply search filter (lowest priority)
  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(ad =>
      (ad.name?.toLowerCase?.().includes(term) ?? false) ||
      (ad.advertiser?.toLowerCase?.().includes(term) ?? false) ||
      (ad.type?.toLowerCase?.().includes(term) ?? false) ||
      String(getEntityId(ad) ?? '').includes(searchTerm)
    );
  }

  return filtered;
};

/**
 * Custom hook for deferred advertisements filtering with loading states
 * Variable names follow docs/variable-origins.md registry
 */
export function useDeferredAdvertisementsFilter(params: FilterParams): UseDeferredAdvertisementsFilterReturn {
  const [isPending, startTransition] = useTransition();
  const [filteredAdvertisements, setFilteredAdvertisements] = useState<any[]>([]);
  const [filterCount, setFilterCount] = useState(0);

  // Memoize the filter parameters to prevent unnecessary re-renders
  const stableParams = useMemo(() => ({
    advertisements: params.advertisements,
    selectedAdvertisements: params.selectedAdvertisements,
    showOnlySelectedAds: params.showOnlySelectedAds,
    selectedTypes: params.selectedTypes,
    showActiveOnly: params.showActiveOnly,
    searchTerm: params.searchTerm,
    entities: params.entities
  }), [
    params.advertisements?.length,
    JSON.stringify(params.selectedAdvertisements ? [...params.selectedAdvertisements].sort() : []),
    params.showOnlySelectedAds,
    JSON.stringify(params.selectedTypes ? [...params.selectedTypes].sort() : []),
    params.showActiveOnly,
    params.searchTerm,
    params.entities?.advertiser?.name
  ]);

  // Apply filtering only when stable params change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      startTransition(() => {
        const result = applyAdvertisementFilters(stableParams);
        setFilteredAdvertisements(result);
        setFilterCount(result.length);
      });
    }, 150); // Debounce for stability

    return () => clearTimeout(timeoutId);
  }, [stableParams]);

  return {
    filteredAdvertisements,
    isFiltering: isPending,
    filterCount
  };
}
