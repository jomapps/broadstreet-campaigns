/**
 * ZONES CONTENT - MAIN ZONES UI
 * 
 * Main zones content component that displays zones overview, filters, and grid.
 * Reads data from Zustand stores and provides zone selection and management functionality.
 * All variable names follow docs/variable-origins.md registry.
 */

'use client';

import { useState, useMemo } from 'react';
import { useEntityStore, useAllFilters, useFilterActions } from '@/stores';
import { useSelectedEntities } from '@/lib/hooks/use-selected-entities';
import { useDeferredZonesFilter } from '@/lib/hooks/use-deferred-zones-filter';

import { getEntityId } from '@/lib/utils/entity-helpers';
import { hasMultipleSizeTypes } from '@/lib/utils/zone-parser';

import ZoneSizeFilters from './ZoneSizeFilters';
import ZoneSelectionControls from './ZoneSelectionControls';
import ZonesList from './ZonesList';
import { FilterLoadingOverlay } from '@/components/ui/filter-loading-overlay';

// Type for zone data from Zustand store
type ZoneLean = {
  _id: string;
  broadstreet_id?: number;
  mongo_id?: string;
  name: string;
  network_id: number;
  alias?: string;
  self_serve?: boolean;
  size_type?: string;
  size_number?: number;
  category?: string;
  block?: boolean;
  is_home?: boolean;
  created_locally?: boolean;
  synced_with_api?: boolean;
  source?: 'api' | 'local';
};

/**
 * ZonesOverview - Zones count display component
 * Variable names follow docs/variable-origins.md registry
 */
function ZonesOverview() {
  const { zones, isLoading } = useEntityStore();
  
  if (isLoading.zones) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-48"></div>
            </div>
            <div className="text-right">
              <div className="h-8 bg-gray-200 rounded w-24 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const apiZones = zones.filter(zone => (zone as any).source === 'api' || !(zone as any).created_locally);
  const localZones = zones.filter(zone => (zone as any).source === 'local' || ((zone as any).created_locally && !(zone as any).synced_with_api));
  const totalZoneCount = zones.length;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Zones Overview</h2>
          <p className="text-gray-600 mt-1">
            Total zones available across all networks
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            Zones: {totalZoneCount} ✅
          </div>
          <div className="text-sm text-gray-500">
            {apiZones.length} synced • {localZones.length} local
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ZonesFilters - Zone filtering and selection wrapper
 * Variable names follow docs/variable-origins.md registry
 */
function ZonesFilters() {
  // Get data from Zustand stores using exact names from docs/variable-origins.md registry
  const { zones, networks, isLoading } = useEntityStore();
  const { selectedZones, showOnlySelected } = useAllFilters();
  const entities = useSelectedEntities();
  
  // Local filter state
  const [selectedSizes, setSelectedSizes] = useState<('SQ' | 'PT' | 'LS' | 'CS')[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [negativeSearchTerm, setNegativeSearchTerm] = useState('');

  // Helper: derive selection key using standardized utility
  const zoneSelectionKey = (zone: ZoneLean) => {
    const entityId = getEntityId(zone);
    return typeof entityId === 'number' ? String(entityId) : entityId || zone._id;
  };

  // Create network map for zone display and filtering
  const networkMap = useMemo(() => {
    const map = new Map<number, string>();
    networks.forEach(network => {
      if (network.broadstreet_id) {
        map.set(network.broadstreet_id, network.name);
      }
    });
    return map;
  }, [networks]);

  // Use deferred filtering for better performance with loading states
  const { filteredZones, isFiltering, filterCount } = useDeferredZonesFilter({
    zones,
    selectedZones: selectedZones || [],
    showOnlySelected,
    selectedSizes,
    searchTerm,
    negativeSearchTerm,
    networkMap,
    entities
  });

  if (isLoading.zones) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-32 mb-3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      <ZoneSizeFilters
        selectedSizes={selectedSizes}
        onSizeFilterChange={setSelectedSizes}
      />

      <ZoneSelectionControls
        zones={filteredZones as any}
        selectedZones={selectedZones as any}
        showOnlySelected={showOnlySelected}
      />

      <div className="relative">
        <ZonesList
          zones={zones as any}
          networkMap={networkMap}
          selectedSizes={selectedSizes}
          onSizeFilterChange={setSelectedSizes}
          selectedZones={selectedZones as any}
          showOnlySelected={showOnlySelected}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          negativeSearchTerm={negativeSearchTerm}
          onNegativeSearchChange={setNegativeSearchTerm}
          filteredZones={filteredZones as any}
        />

        {/* Loading overlay during filtering operations */}
        <FilterLoadingOverlay
          isVisible={isFiltering}
          filterCount={filterCount}
          totalCount={zones?.length}
        />
      </div>
    </div>
  );
}

/**
 * ZonesContent - Main zones content component
 * Variable names follow docs/variable-origins.md registry
 */
export default function ZonesContent() {
  return (
    <div className="space-y-6">
      <ZonesOverview />
      <ZonesFilters />
    </div>
  );
}
