'use client';

import { useState, useMemo } from 'react';
import { useAllFilters } from '@/stores';
import { useSelectedEntities } from '@/lib/hooks/use-selected-entities';
import ZoneSizeFilters from './ZoneSizeFilters';
import ZonesList from './ZonesList';
import ZoneSelectionControls from './ZoneSelectionControls';
import { hasMultipleSizeTypes } from '@/lib/utils/zone-parser';
import { ZoneLean } from '@/lib/types/lean-entities';
import { getEntityId } from '@/lib/utils/entity-helpers';

interface ZoneFiltersWrapperProps {
  zones: ZoneLean[];
  networkMap: Map<number, string>;
}

export default function ZoneFiltersWrapper({ zones, networkMap }: ZoneFiltersWrapperProps) {
  const [selectedSizes, setSelectedSizes] = useState<('SQ' | 'PT' | 'LS' | 'CS')[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const entities = useSelectedEntities();
  const { selectedZones, showOnlySelected } = useAllFilters();

  // Helper: derive selection key using standardized utility (same as ZoneSelectionControls)
  const zoneSelectionKey = (zone: ZoneLean) => {
    const entityId = getEntityId(zone);
    return typeof entityId === 'number' ? String(entityId) : entityId || zone._id;
  };

  // Apply all filters to get the currently visible zones
  const filteredZones = useMemo(() => {
    if (!zones || !Array.isArray(zones)) {
      return [];
    }

    let filtered = zones;

    // 1. Apply "Only Selected" filter first (highest priority)
    if (showOnlySelected && selectedZones.length > 0) {
      filtered = filtered.filter(zone => selectedZones.includes(zoneSelectionKey(zone)));
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
        
        // If only regular sizes are selected, filter by them
        if (regularSizes.length > 0 && !selectedSizes.includes('CS')) {
          return zone.size_type && regularSizes.includes(zone.size_type as 'SQ' | 'PT' | 'LS');
        }
        
        return false;
      });
    }
    
    // 3. Apply search filter (lowest priority)
    if (searchTerm.trim()) {
      filtered = filtered.filter(zone =>
        zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (zone.alias && zone.alias.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (zone.category && zone.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (zone.block && zone.block.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (zone.size_type && zone.size_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (networkMap.get(zone.network_id) && networkMap.get(zone.network_id)!.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (zone.broadstreet_id && zone.broadstreet_id.toString().includes(searchTerm)) ||
        zone._id.includes(searchTerm)
      );
    }
    
    return filtered;
  }, [zones, searchTerm, selectedSizes, networkMap, selectedZones, showOnlySelected]);

  return (
    <div className="space-y-6">
      <ZoneSizeFilters 
        selectedSizes={selectedSizes}
        onSizeFilterChange={setSelectedSizes}
      />
      
      {/**
       * Note: Network gating is intentionally handled inside `ZonesList` to avoid duplicating gate logic here.
       * This keeps the wrapper focused on size/search filters and selection state.
       */}
      <ZoneSelectionControls 
        zones={filteredZones}
        selectedZones={selectedZones}
        showOnlySelected={showOnlySelected}
      />
      
      <ZonesList 
        zones={zones} 
        networkMap={networkMap}
        selectedSizes={selectedSizes}
        onSizeFilterChange={setSelectedSizes}
        selectedZones={selectedZones}
        showOnlySelected={showOnlySelected}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filteredZones={filteredZones}
      />
    </div>
  );
}
