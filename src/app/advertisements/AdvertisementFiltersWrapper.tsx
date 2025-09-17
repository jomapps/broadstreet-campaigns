'use client';

import { useState, useMemo } from 'react';
import { useFilters } from '@/contexts/FilterContext';
import { useSelectedEntities } from '@/lib/hooks/use-selected-entities';
import { getEntityId } from '@/lib/utils/entity-helpers';
import { AdvertisementLean } from '@/lib/types/lean-entities';
import AdvertisementSelectionControls from './AdvertisementSelectionControls';
import AdvertisementsList from './AdvertisementsList';

interface AdvertisementFiltersWrapperProps {
  advertisements: AdvertisementLean[];
}

export default function AdvertisementFiltersWrapper({ advertisements }: AdvertisementFiltersWrapperProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const entities = useSelectedEntities();
  const { selectedAdvertisements, showOnlySelectedAds } = useFilters();

  // Get unique advertisement types for filtering (only from the selected advertiser's ads)
  const advertisementTypes = useMemo(() => {
    let adsToFilter = advertisements;
    
    // Only include ads from the selected advertiser
    const advertiserName = entities.advertiser?.name;
    if (advertiserName) {
      adsToFilter = advertisements.filter(ad => ad.advertiser === advertiserName);
    }
    
    const types = [...new Set(adsToFilter.map(ad => ad.type).filter(Boolean))];
    return types.sort();
  }, [advertisements, entities.advertiser?.name]);

  // Apply all filters to get the currently visible advertisements
  const filteredAdvertisements = useMemo(() => {
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
      filtered = filtered.filter(ad => selectedAdvertisements.includes(ad._id));
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
  }, [advertisements, searchTerm, selectedTypes, showActiveOnly, selectedAdvertisements, showOnlySelectedAds, entities.advertiser?.name]);

  // Check if network and advertiser are selected
  if (!entities.network || !entities.advertiser) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Type Filters */}
      {advertisementTypes.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="card-title text-gray-900 mb-3">Filter by Type</h3>
          <div className="flex flex-wrap gap-2">
            {advertisementTypes.map(type => (
              <button
                key={type}
                onClick={() => {
                  setSelectedTypes(prev => 
                    prev.includes(type) 
                      ? prev.filter(t => t !== type)
                      : [...prev, type]
                  );
                }}
                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                  selectedTypes.includes(type)
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Status Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="active-only"
            checked={showActiveOnly}
            onChange={(e) => setShowActiveOnly(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="active-only" className="text-sm font-medium text-gray-700">
            Show only active advertisements
          </label>
        </div>
      </div>
      
      <AdvertisementSelectionControls 
        advertisements={filteredAdvertisements}
        selectedAdvertisements={selectedAdvertisements}
        showOnlySelectedAds={showOnlySelectedAds}
      />
      
      <AdvertisementsList 
        advertisements={advertisements} 
        selectedAdvertisements={selectedAdvertisements}
        showOnlySelectedAds={showOnlySelectedAds}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filteredAdvertisements={filteredAdvertisements}
      />
    </div>
  );
}
