'use client';

import { useState, useMemo } from 'react';
import { useFilters } from '@/contexts/FilterContext';
import { SearchInput } from '@/components/ui/search-input';
import { getSizeInfo } from '@/lib/utils/zone-parser';

// Type for serialized zone data (plain object without Mongoose methods)
type ZoneLean = {
  _id: string;
  __v: number;
  id: number;
  name: string;
  network_id: number;
  alias?: string | null;
  self_serve: boolean;
  size_type?: 'SQ' | 'PT' | 'LS' | null;
  size_number?: number | null;
  category?: string | null;
  block?: string | null;
  is_home?: boolean;
  createdAt: string;
  updatedAt: string;
};

interface ZoneCardProps {
  zone: ZoneLean;
  networkName?: string;
}

function ZoneCard({ zone, networkName }: ZoneCardProps) {
  const sizeInfo = zone.size_type ? getSizeInfo(zone.size_type) : null;
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{zone.name}</h3>
          {networkName && (
            <p className="text-sm text-gray-600 mt-1">Network: {networkName}</p>
          )}
          {zone.alias && (
            <p className="text-sm text-gray-500 mt-1">Alias: {zone.alias}</p>
          )}
        </div>
        
        <div className="flex flex-col items-end space-y-2">
          {zone.size_type && (
            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
              {zone.size_type}
              {zone.size_number && zone.size_number}
            </span>
          )}
          <span className="text-xs text-gray-500">ID: {zone.id}</span>
        </div>
      </div>
      
      {sizeInfo && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-900">{sizeInfo.description}</p>
          <p className="text-sm text-gray-600">Dimensions: {sizeInfo.dimensions}px</p>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        {zone.category && (
          <div>
            <p className="text-sm text-gray-600">Category</p>
            <p className="text-sm font-medium text-gray-900">{zone.category}</p>
          </div>
        )}
        {zone.block && (
          <div>
            <p className="text-sm text-gray-600">Block</p>
            <p className="text-sm font-medium text-gray-900">{zone.block}</p>
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
}

export default function ZonesList({ zones, networkMap }: ZonesListProps) {
  const { selectedNetwork } = useFilters();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredZones = useMemo(() => {
    if (!zones || !Array.isArray(zones)) {
      return [];
    }
    
    if (!searchTerm.trim()) {
      return zones;
    }
    
    return zones.filter(zone =>
      zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (zone.alias && zone.alias.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (zone.category && zone.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (zone.block && zone.block.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (zone.size_type && zone.size_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (networkMap.get(zone.network_id) && networkMap.get(zone.network_id)!.toLowerCase().includes(searchTerm.toLowerCase())) ||
      zone.id.toString().includes(searchTerm)
    );
  }, [zones, searchTerm, networkMap]);

  // Check if network is selected
  if (!selectedNetwork) {
    return (
      <div className="text-center py-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Network Required</h3>
          <p className="text-yellow-700 mb-4">
            Please select a network from the sidebar filters to view zones.
          </p>
          <p className="text-sm text-yellow-600">
            Zones are specific to each network, so you need to choose which network&apos;s zones you want to see.
          </p>
        </div>
      </div>
    );
  }

  if (!zones || zones.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No zones found for the selected network. Try syncing data first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="max-w-md">
        <SearchInput
          placeholder="Search zones..."
          value={searchTerm}
          onChange={setSearchTerm}
        />
      </div>
      
      {filteredZones.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No zones match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredZones.map((zone) => (
            <ZoneCard 
              key={zone.id} 
              zone={zone} 
              networkName={networkMap.get(zone.network_id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
