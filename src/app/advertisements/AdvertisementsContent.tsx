/**
 * ADVERTISEMENTS CONTENT - MAIN ADVERTISEMENTS UI
 * 
 * Main advertisements content component that displays advertisements grid and filters.
 * Reads data from Zustand stores and provides advertisement selection and management functionality.
 * All variable names follow docs/variable-origins.md registry.
 */

'use client';

import { useState, useMemo } from 'react';
import { useEntityStore, useAllFilters } from '@/stores';
import { useSelectedEntities } from '@/lib/hooks/use-selected-entities';
import { useDeferredAdvertisementsFilter } from '@/lib/hooks/use-deferred-advertisements-filter';
import { getEntityId } from '@/lib/utils/entity-helpers';
import AdvertisementSelectionControls from './AdvertisementSelectionControls';
import AdvertisementsList from './AdvertisementsList';
import { FilterLoadingOverlay } from '@/components/ui/filter-loading-overlay';

/**
 * AdvertisementTypeFilters - Type filtering component
 * Variable names follow docs/variable-origins.md registry
 */
function AdvertisementTypeFilters({ 
  advertisementTypes, 
  selectedTypes, 
  onTypeToggle 
}: {
  advertisementTypes: string[];
  selectedTypes: string[];
  onTypeToggle: (type: string) => void;
}) {
  if (advertisementTypes.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="card-title text-gray-900 mb-3">Filter by Type</h3>
      <div className="flex flex-wrap gap-2">
        {advertisementTypes.map(type => (
          <button
            key={type}
            onClick={() => onTypeToggle(type)}
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
  );
}

/**
 * AdvertisementActiveFilter - Active status filtering component
 * Variable names follow docs/variable-origins.md registry
 */
function AdvertisementActiveFilter({ 
  showActiveOnly, 
  onActiveToggle 
}: {
  showActiveOnly: boolean;
  onActiveToggle: (active: boolean) => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="active-only"
          checked={showActiveOnly}
          onChange={(e) => onActiveToggle(e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="active-only" className="text-sm font-medium text-gray-700">
          Show only active advertisements
        </label>
      </div>
    </div>
  );
}

/**
 * AdvertisementsFilters - Main advertisements filtering and display component
 * Variable names follow docs/variable-origins.md registry
 */
function AdvertisementsFilters() {
  // Get data from Zustand stores using exact names from docs/variable-origins.md registry
  const { advertisements, isLoading } = useEntityStore();
  const { selectedAdvertisements, showOnlySelectedAds } = useAllFilters();
  const entities = useSelectedEntities();
  
  // Local filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [showActiveOnly, setShowActiveOnly] = useState(false);

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

  // Use deferred filtering for better performance with loading states
  const { filteredAdvertisements, isFiltering, filterCount } = useDeferredAdvertisementsFilter({
    advertisements,
    selectedAdvertisements: selectedAdvertisements || [],
    showOnlySelectedAds,
    selectedTypes,
    showActiveOnly,
    searchTerm,
    entities
  });

  // Handle type filter toggle
  const handleTypeToggle = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  if (isLoading.advertisements) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-32 mb-3"></div>
            <div className="flex flex-wrap gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-200 rounded-full w-16"></div>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="animate-pulse">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-48"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if network and advertiser are selected
  if (!entities.network || !entities.advertiser) {
    return (
      <div className="text-center py-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="card-title text-yellow-800 mb-2">Network and Advertiser Required</h3>
          <p className="card-text text-yellow-700 mb-4">
            Please select both a network and an advertiser from the sidebar filters to view advertisements.
          </p>
          <p className="card-text text-yellow-600">
            Advertisements belong to specific advertisers within networks.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdvertisementTypeFilters 
        advertisementTypes={advertisementTypes}
        selectedTypes={selectedTypes}
        onTypeToggle={handleTypeToggle}
      />
      
      <AdvertisementActiveFilter 
        showActiveOnly={showActiveOnly}
        onActiveToggle={setShowActiveOnly}
      />
      
      <AdvertisementSelectionControls
        advertisements={filteredAdvertisements as any}
        selectedAdvertisements={selectedAdvertisements.map(String)}
        showOnlySelectedAds={showOnlySelectedAds}
      />

      <div className="relative">
        <AdvertisementsList
          advertisements={advertisements as any}
          selectedAdvertisements={selectedAdvertisements.map(String)}
          showOnlySelectedAds={showOnlySelectedAds}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filteredAdvertisements={filteredAdvertisements as any}
        />

        {/* Loading overlay during filtering operations */}
        <FilterLoadingOverlay
          isVisible={isFiltering}
          filterCount={filterCount}
          totalCount={advertisements?.length}
          entityType="advertisements"
        />
      </div>
    </div>
  );
}

/**
 * AdvertisementsContent - Main advertisements content component
 * Variable names follow docs/variable-origins.md registry
 */
export default function AdvertisementsContent() {
  return <AdvertisementsFilters />;
}
