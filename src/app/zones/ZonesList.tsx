'use client';

import { useState, useMemo } from 'react';
import { useFilters } from '@/contexts/FilterContext';
import { useSelectedEntities } from '@/lib/hooks/use-selected-entities';
import { SearchInput } from '@/components/ui/search-input';
import { getSizeInfo, hasMultipleSizeTypes } from '@/lib/utils/zone-parser';
import { cardStateClasses } from '@/lib/ui/cardStateClasses';

// Type for serialized zone data (plain object without Mongoose methods)
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

interface ZoneCardProps {
  zone: ZoneLean;
  networkName?: string;
  isSelected?: boolean;
  onToggleSelection?: (zoneId: string) => void;
}

function ZoneCard({ zone, networkName, isSelected = false, onToggleSelection }: ZoneCardProps) {
  const sizeInfo = zone.size_type ? getSizeInfo(zone.size_type) : null;
  const isLocalZone = zone.source === 'local' || zone.created_locally;
  const isConflictZone = hasMultipleSizeTypes(zone.name);

  const handleCardClick = () => {
    if (onToggleSelection) {
      onToggleSelection(zone._id);
    }
  };
  
  const slug = zone.name.replace(/\s+/g, '-').toLowerCase();

  return (
    <div 
      className={`rounded-lg shadow-sm border-2 p-6 transition-all duration-200 cursor-pointer ${cardStateClasses({ isLocal: isLocalZone, isSelected })}`}
      onClick={handleCardClick}
      data-testid={`zone-${slug}`}
      data-zone-name={zone.name}
    >
      <div className="flex items-start justify-between mb-4" data-testid="zone-card">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="card-title text-gray-900" data-testid="zone-name">{zone.name}</h3>
            {isLocalZone && (
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-orange-500 text-white shadow-sm">
                🏠 Local
              </span>
            )}
          </div>
          {networkName && (
            <p className="card-text text-gray-600 mt-1">Network: {networkName}</p>
          )}
          {zone.alias && (
            <p className="card-text text-gray-500 mt-1">Alias: {zone.alias}</p>
          )}
        </div>
        
        <div className="flex flex-col items-end space-y-2">
          {isSelected && (
            <span className="px-2 py-1 text-xs rounded-full bg-blue-500 text-white font-semibold">
              ✓ Selected
            </span>
          )}
          {isConflictZone && (
            <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 font-semibold">
              CS
            </span>
          )}
          {zone.size_type && !isConflictZone && (
            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
              {zone.size_type}
              {zone.size_number && zone.size_number}
            </span>
          )}
          <span className="card-meta text-gray-500">
            ID: {zone.id || zone._id.slice(-8)}
          </span>
        </div>
      </div>
      
      {isConflictZone && (
        <div className={`mb-4 p-3 rounded-lg ${
          isLocalZone ? 'bg-red-200' : 'bg-red-50'
        }`}>
          <p className="card-text font-medium text-red-900">⚠️ Conflict Size</p>
          <p className="card-text text-red-700">Multiple size types detected in zone name</p>
        </div>
      )}
      
      {sizeInfo && !isConflictZone && (
        <div className={`mb-4 p-3 rounded-lg ${
          isLocalZone ? 'bg-orange-200' : 'bg-gray-50'
        }`}>
          <p className="card-text font-medium text-gray-900">{sizeInfo.description}</p>
          <p className="card-text text-gray-600">Dimensions: {sizeInfo.dimensions}px</p>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        {zone.category && (
          <div>
            <p className="card-text text-gray-600">Category</p>
            <p className="card-text font-medium text-gray-900">{zone.category}</p>
          </div>
        )}
        {zone.block && (
          <div>
            <p className="card-text text-gray-600">Block</p>
            <p className="card-text font-medium text-gray-900">{zone.block}</p>
          </div>
        )}
      </div>
      
      <div className="mt-4 flex items-center space-x-4">
        {zone.is_home && (
          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
            Home Page
          </span>
        )}
        {zone.self_serve && (
          <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
            Self Serve
          </span>
        )}
      </div>
    </div>
  );
}

interface ZonesListProps {
  zones: ZoneLean[];
  networkMap: Map<number, string>;
  selectedSizes?: ('SQ' | 'PT' | 'LS' | 'CS')[];
  onSizeFilterChange?: (sizes: ('SQ' | 'PT' | 'LS' | 'CS')[]) => void;
  selectedZones?: string[];
  showOnlySelected?: boolean;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  filteredZones?: ZoneLean[];
}

export default function ZonesList({ 
  zones, 
  networkMap, 
  selectedSizes = [], 
  selectedZones = [], 
  showOnlySelected = false,
  searchTerm = '',
  onSearchChange,
  filteredZones
}: ZonesListProps) {
  const entities = useSelectedEntities();
  const { toggleZoneSelection } = useFilters();
  
  // Use filtered zones if provided, otherwise fall back to local filtering
  const displayZones = filteredZones || zones;

  // Check if network is selected
  if (!entities.network) {
    return (
      <div className="text-center py-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="card-title text-yellow-800 mb-2">Network Required</h3>
          <p className="card-text text-yellow-700 mb-4">
            Please select a network from the sidebar filters to view zones.
          </p>
          <p className="card-text text-yellow-600">
            Zones are specific to each network, so you need to choose which network&apos;s zones you want to see.
          </p>
        </div>
      </div>
    );
  }

  if (!zones || zones.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="card-text text-gray-500">No zones found for the selected network. Try syncing data first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="zones-list">
      <div className="max-w-md">
        <SearchInput
          placeholder="Search zones..."
          value={searchTerm}
          onChange={onSearchChange || (() => {})}
        />
      </div>
      
      {displayZones.length === 0 ? (
        <div className="text-center py-12">
          <p className="card-text text-gray-500">No zones match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayZones.map((zone) => (
            <ZoneCard 
              key={zone._id} 
              zone={zone} 
              networkName={networkMap.get(zone.network_id)}
              isSelected={selectedZones.includes(zone._id)}
              onToggleSelection={toggleZoneSelection}
            />
          ))}
        </div>
      )}
    </div>
  );
}
