'use client';

import { useState, useMemo } from 'react';
import { useFilters } from '@/contexts/FilterContext';
import ZoneSizeFilters from './ZoneSizeFilters';
import ZonesList from './ZonesList';
import ZoneSelectionControls from './ZoneSelectionControls';
import { hasMultipleSizeTypes } from '@/lib/utils/zone-parser';

type ZoneLean = {
  _id: string;
  __v: number;
  id?: number;
  name: string;
  network_id: number;
  alias?: string | null;
  self_serve: boolean;
  size_type?: 'SQ' | 'PT' | 'LS' | 'CS' | null;
  size_number?: number | null;
  category?: string | null;
  block?: string | null;
  is_home?: boolean;
  // LocalZone specific fields
  created_locally?: boolean;
  synced_with_api?: boolean;
  created_at?: string;
  synced_at?: string;
  original_broadstreet_id?: number;
  sync_errors?: string[];
  // Additional LocalZone fields
  advertisement_count?: number;
  allow_duplicate_ads?: boolean;
  concurrent_campaigns?: number;
  advertisement_label?: string;
  archived?: boolean;
  display_type?: 'standard' | 'rotation';
  rotation_interval?: number;
  animation_type?: string;
  width?: number;
  height?: number;
  rss_shuffle?: boolean;
  style?: string;
  source?: 'api' | 'local';
  createdAt: string;
  updatedAt: string;
};

interface ZoneFiltersWrapperProps {
  zones: ZoneLean[];
  networkMap: Map<number, string>;
}

export default function ZoneFiltersWrapper({ zones, networkMap }: ZoneFiltersWrapperProps) {
  const [selectedSizes, setSelectedSizes] = useState<('SQ' | 'PT' | 'LS' | 'CS')[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { selectedZones, showOnlySelected, selectedNetwork } = useFilters();

  // Apply all filters to get the currently visible zones
  const filteredZones = useMemo(() => {
    if (!zones || !Array.isArray(zones)) {
      return [];
    }
    
    let filtered = zones;
    
    // 1. Apply "Only Selected" filter first (highest priority)
    if (showOnlySelected && selectedZones.length > 0) {
      filtered = filtered.filter(zone => selectedZones.includes(zone._id));
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
        const regularSizes = selectedSizes.filter(size => size !== 'CS');
        if (regularSizes.length > 0 && zone.size_type && regularSizes.includes(zone.size_type)) {
          return true;
        }
        
        // If CS is selected but no regular sizes, only show conflict zones
        if (selectedSizes.includes('CS') && regularSizes.length === 0) {
          return hasMultipleSizeTypes(zone.name);
        }
        
        // If only regular sizes are selected, filter by them
        if (regularSizes.length > 0 && !selectedSizes.includes('CS')) {
          return zone.size_type && regularSizes.includes(zone.size_type);
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
        (zone.id && zone.id.toString().includes(searchTerm)) ||
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
