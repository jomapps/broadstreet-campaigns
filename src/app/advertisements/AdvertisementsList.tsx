'use client';

import { useState, useMemo } from 'react';
import { useFilters } from '@/contexts/FilterContext';
import { useSelectedEntities } from '@/lib/hooks/use-selected-entities';
import { SearchInput } from '@/components/ui/search-input';
import { cardStateClasses } from '@/lib/ui/cardStateClasses';
import { AdvertisementLean } from '@/lib/types/lean-entities';

interface AdvertisementCardProps {
  advertisement: AdvertisementLean;
  isSelected?: boolean;
  onToggleSelection?: (advertisementId: string) => void;
}

function AdvertisementCard({ advertisement, isSelected = false, onToggleSelection }: AdvertisementCardProps) {
  const updatedDate = new Date(advertisement.updated_at);
  const isLocal = (advertisement as any).created_locally && !(advertisement as any).synced_with_api;

  const handleCardClick = () => {
    if (onToggleSelection) {
      onToggleSelection(String(advertisement.broadstreet_id));
    }
  };
  
  return (
    <div 
      className={`rounded-lg shadow-sm border-2 p-6 transition-all duration-200 cursor-pointer ${cardStateClasses({ isLocal, isSelected })}`}
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="card-title text-gray-900">{advertisement.name}</h3>
          <p className="card-text text-gray-600 mt-1">Advertiser: {advertisement.advertiser}</p>
        </div>
        
        <div className="flex flex-col items-end space-y-2">
          {isSelected && (
            <span className="px-2 py-1 text-xs rounded-full bg-blue-500 text-white font-semibold">
              ✓ Selected
            </span>
          )}
          {isLocal && (
            <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800 font-semibold">
              Local
            </span>
          )}
          <span className={`px-2 py-1 text-xs rounded-full ${
            advertisement.active_placement 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {advertisement.active_placement ? 'Active' : 'Inactive'}
          </span>
          <span className="card-meta text-gray-500">ID: {advertisement.broadstreet_id}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="card-text text-gray-600">Type</p>
          <p className="card-text font-medium text-gray-900">{advertisement.type}</p>
        </div>
        <div>
          <p className="card-text text-gray-600">Last Updated</p>
          <p className="card-text font-medium text-gray-900">
            {updatedDate.toLocaleDateString()}
          </p>
        </div>
      </div>
      
      {advertisement.active.url && (
        <div className="mb-4">
          <p className="card-text text-gray-600 mb-2">Active Image</p>
          <img
            src={advertisement.active.url}
            alt={advertisement.name}
            className="w-full h-32 object-cover rounded border"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}
      
      <div className="flex space-x-2">
        <a
          href={advertisement.preview_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-3 rounded card-text font-medium transition-colors duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          Preview
        </a>
      </div>
    </div>
  );
}

interface AdvertisementsListProps {
  advertisements: AdvertisementLean[];
  selectedAdvertisements?: string[];
  showOnlySelectedAds?: boolean;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  filteredAdvertisements?: AdvertisementLean[];
}

export default function AdvertisementsList({ 
  advertisements, 
  selectedAdvertisements = [], 
  showOnlySelectedAds = false,
  searchTerm = '',
  onSearchChange,
  filteredAdvertisements
}: AdvertisementsListProps) {
  const entities = useSelectedEntities();
  const { toggleAdvertisementSelection } = useFilters();
  const [localSearchTerm, setLocalSearchTerm] = useState('');

  // Use provided search term or local one
  const currentSearchTerm = searchTerm || localSearchTerm;
  const handleSearchChange = onSearchChange || setLocalSearchTerm;

  // Use filtered advertisements if provided, otherwise fall back to local filtering
  const displayAdvertisements = filteredAdvertisements || advertisements;

  // Check if network is selected
  if (!entities.network) {
    return (
      <div className="text-center py-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="card-title text-yellow-800 mb-2">Network Required</h3>
          <p className="card-text text-yellow-700 mb-4">
            Please select a network from the sidebar filters to view advertisements.
          </p>
          <p className="card-text text-yellow-600">
            Advertisements are specific to each network, so you need to choose which network&apos;s advertisements you want to see.
          </p>
        </div>
      </div>
    );
  }

  // Check if advertiser is selected
  if (!entities.advertiser) {
    return (
      <div className="text-center py-12">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="card-title text-blue-800 mb-2">Advertiser Required</h3>
          <p className="card-text text-blue-700 mb-4">
            Please select an advertiser from the sidebar filters to view advertisements.
          </p>
          <p className="card-text text-blue-600">
            Advertisements belong to specific advertisers, so you need to choose which advertiser&apos;s advertisements you want to see. Advertisement selection is only available within a specific advertiser context.
          </p>
        </div>
      </div>
    );
  }


  if (advertisements.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="card-text text-gray-500">No advertisements found for the selected filters. Try syncing data first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="max-w-md">
        <SearchInput
          placeholder="Search advertisements..."
          value={currentSearchTerm}
          onChange={handleSearchChange}
        />
      </div>
      
      {displayAdvertisements.length === 0 ? (
        <div className="text-center py-12">
          <p className="card-text text-gray-500">No advertisements match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayAdvertisements.map((advertisement) => {
            const selectionId = String((advertisement as any).broadstreet_id ?? (advertisement as any)._id);
            return (
              <AdvertisementCard 
                key={advertisement._id || String(advertisement.broadstreet_id)}
                advertisement={advertisement}
                isSelected={selectedAdvertisements.includes(selectionId)}
                onToggleSelection={() => toggleAdvertisementSelection(selectionId)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
