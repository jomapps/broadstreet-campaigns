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
  selectedZones: Array<string | number>;
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
    const selectedSet = new Set(selectedZones.map(z => String(z)));
    filtered = filtered.filter(zone =>
      selectedSet.has(getZoneSelectionKey(zone as any))
    );
  }
  
  // 2. Apply size filter (match original simple logic)
  if (selectedSizes && selectedSizes.length > 0) {
    filtered = filtered.filter(zone => {
      // Only include zones that have a valid size_type that matches the selected sizes
      return zone.size_type && selectedSizes.includes(zone.size_type);
    });
  }

  // 3. Apply positive search filter first
  if (searchTerm.trim()) {
    const searchLower = searchTerm.toLowerCase();
    filtered = filtered.filter(zone => {
      const networkName = networkMap?.get(zone.network_id) || '';
      return (
        zone.name?.toLowerCase().includes(searchLower) ||
        zone.alias?.toLowerCase().includes(searchLower) ||
        zone.category?.toLowerCase().includes(searchLower) ||
        zone.block?.toLowerCase().includes(searchLower) ||
        zone.size_type?.toLowerCase().includes(searchLower) ||
        zone.broadstreet_id?.toString().includes(searchLower) ||
        zone._id?.toString().includes(searchLower) ||
        networkName.toLowerCase().includes(searchLower)
      );
    });
  }

  // 4. Apply negative search filter (excludes zones containing the term)
  if (negativeSearchTerm.trim()) {
    const negativeSearchLower = negativeSearchTerm.toLowerCase();
    filtered = filtered.filter(zone => {
      const networkName = networkMap?.get(zone.network_id) || '';
      return !(
        zone.name?.toLowerCase().includes(negativeSearchLower) ||
        zone.alias?.toLowerCase().includes(negativeSearchLower) ||
        zone.category?.toLowerCase().includes(negativeSearchLower) ||
        zone.block?.toLowerCase().includes(negativeSearchLower) ||
        zone.size_type?.toLowerCase().includes(negativeSearchLower) ||
        zone.broadstreet_id?.toString().includes(negativeSearchLower) ||
        zone._id?.toString().includes(negativeSearchLower) ||
        networkName.toLowerCase().includes(negativeSearchLower)
      );
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
    params.selectedZones ? JSON.stringify([...params.selectedZones].sort()) : undefined,
    params.showOnlySelected,
    params.selectedSizes ? JSON.stringify([...params.selectedSizes].sort()) : undefined,
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
