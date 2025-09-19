/**
 * DEFERRED ZONES FILTER HOOK
 * 
 * Custom hook that provides deferred filtering for zones to improve performance
 * with large datasets. Uses React's useDeferredValue and useTransition to
 * provide loading states during expensive filtering operations.
 * All variable names follow docs/variable-origins.md registry.
 */

import { useMemo, useTransition, useEffect, useState, useCallback } from 'react';
import { hasMultipleSizeTypes } from '@/lib/utils/zone-parser';
import { getEntityId } from '@/lib/utils/entity-helpers';
import { ZoneLean } from '@/lib/types/lean-entities';

/**
 * Interface for filter parameters
 * Variable names follow docs/variable-origins.md registry
 */
interface FilterParams {
  zones: any[];
  selectedZones: string[];
  showOnlySelected: boolean;
  selectedSizes: ('SQ' | 'PT' | 'LS' | 'CS')[];
  searchTerm: string;
  negativeSearchTerm: string;
  networkMap: Map<number, string>;
  entities: any;
}

/**
 * Interface for hook return value
 * Variable names follow docs/variable-origins.md registry
 */
interface UseDeferredZonesFilterReturn {
  filteredZones: any[];
  isFiltering: boolean;
  filterCount: number;
}

/**
 * Helper function to derive zone selection key
 * Variable names follow docs/variable-origins.md registry
 */
const getZoneSelectionKey = (zone: ZoneLean) => {
  const entityId = getEntityId(zone);
  return typeof entityId === 'number' ? String(entityId) : entityId || zone._id;
};

/**
 * Core filtering logic extracted for reusability
 * Variable names follow docs/variable-origins.md registry
 */
const applyZoneFilters = (params: FilterParams): any[] => {
  const {
    zones,
    selectedZones,
    showOnlySelected,
    selectedSizes,
    searchTerm,
    negativeSearchTerm,
    networkMap,
    entities
  } = params;

  if (!zones || !Array.isArray(zones)) {
    return [];
  }

  let filtered = zones;

  // 1. Apply "Only Selected" filter first (highest priority)
  if (showOnlySelected && selectedZones.length > 0) {
    filtered = filtered.filter(zone => 
      selectedZones.includes(getZoneSelectionKey(zone as any))
    );
  }
  
  // 2. Apply size filters
  if (selectedSizes.length > 0) {
    filtered = filtered.filter(zone => {
      // Handle CS (Conflict Size) filter
      if (selectedSizes.includes('CS')) {
        if (hasMultipleSizeTypes(zone.name)) {
          return true;
        }
      }
      
      // Handle regular size type filters
      const regularSizes = selectedSizes.filter((size): size is 'SQ' | 'PT' | 'LS' => size !== 'CS');
      if (regularSizes.length > 0 && zone.size_type && regularSizes.includes(zone.size_type as 'SQ' | 'PT' | 'LS')) {
        return true;
      }
      
      // If CS is selected but no regular sizes, only show conflict zones
      if (selectedSizes.includes('CS') && regularSizes.length === 0) {
        return hasMultipleSizeTypes(zone.name);
      }
      
      return false;
    });
  }

  // 3. Apply search filter
  if (searchTerm.trim()) {
    const search = searchTerm.toLowerCase();
    filtered = filtered.filter(zone =>
      zone.name.toLowerCase().includes(search) ||
      (zone.alias && zone.alias.toLowerCase().includes(search))
    );
  }

  // 4. Apply negative search filter (supersedes positive search)
  if (negativeSearchTerm.trim()) {
    const negativeSearch = negativeSearchTerm.toLowerCase();
    filtered = filtered.filter(zone => {
      // Check all zone data fields for negative match
      const zoneData = [
        zone.name,
        zone.alias,
        zone.category,
        zone.block,
        zone.size_type,
        zone.broadstreet_id?.toString(),
        zone._id,
        networkMap.get(zone.network_id)
      ].filter(Boolean).join(' ').toLowerCase();

      return !zoneData.includes(negativeSearch);
    });
  }

  // 5. Apply network filter from selected entities
  if (entities.network) {
    const networkId = entities.network.ids.broadstreet_id;
    if (networkId) {
      filtered = filtered.filter(zone => zone.network_id === networkId);
    }
  }

  return filtered;
};

/**
 * Custom hook for deferred zones filtering with loading states
 * Variable names follow docs/variable-origins.md registry
 */
export function useDeferredZonesFilter(params: FilterParams): UseDeferredZonesFilterReturn {
  const [isPending, startTransition] = useTransition();
  const [filteredZones, setFilteredZones] = useState<any[]>([]);
  const [filterCount, setFilterCount] = useState(0);

  // Memoize the filter parameters to prevent unnecessary re-renders
  const stableParams = useMemo(() => ({
    zones: params.zones,
    selectedZones: params.selectedZones,
    showOnlySelected: params.showOnlySelected,
    selectedSizes: params.selectedSizes,
    searchTerm: params.searchTerm,
    negativeSearchTerm: params.negativeSearchTerm,
    networkMap: params.networkMap,
    entities: params.entities
  }), [
    params.zones?.length,
    JSON.stringify(params.selectedZones?.sort()),
    params.showOnlySelected,
    JSON.stringify(params.selectedSizes?.sort()),
    params.searchTerm,
    params.negativeSearchTerm,
    params.networkMap?.size,
    params.entities?.network?.ids?.broadstreet_id
  ]);

  // Apply filtering only when stable params change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      startTransition(() => {
        const result = applyZoneFilters(stableParams);
        setFilteredZones(result);
        setFilterCount(result.length);
      });
    }, 150); // Slightly longer debounce for stability

    return () => clearTimeout(timeoutId);
  }, [stableParams]);

  return {
    filteredZones,
    isFiltering: isPending,
    filterCount
  };
}
