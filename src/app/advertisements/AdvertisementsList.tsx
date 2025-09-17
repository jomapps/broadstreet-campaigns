'use client';

import { useState, useMemo } from 'react';
import { useFilters } from '@/contexts/FilterContext';
import { useSelectedEntities } from '@/lib/hooks/use-selected-entities';
import { getEntityId } from '@/lib/utils/entity-helpers';
import { SearchInput } from '@/components/ui/search-input';
import { AdvertisementLean } from '@/lib/types/lean-entities';
import { UniversalEntityCard } from '@/components/ui/universal-entity-card';

// Map advertisement to universal card props
function mapAdToUniversalProps(
  advertisement: AdvertisementLean,
  isSelected: boolean,
  toggleSelection: (id: string) => void,
  parents: { network?: any; advertiser?: any }
) {
  const selectionId = String(getEntityId(advertisement));
  const parentsBreadcrumb = [
    parents.network && {
      name: String(parents.network?.name ?? 'Network'),
      broadstreet_id: typeof parents.network?.broadstreet_id === 'number' ? parents.network.broadstreet_id : undefined,
      mongo_id: parents.network?.mongo_id ?? parents.network?._id,
      entityType: 'network' as const,
    },
    parents.advertiser && {
      name: String(parents.advertiser?.name ?? 'Advertiser'),
      broadstreet_id: typeof parents.advertiser?.broadstreet_id === 'number' ? parents.advertiser.broadstreet_id : undefined,
      mongo_id: parents.advertiser?.mongo_id ?? parents.advertiser?._id,
      entityType: 'advertiser' as const,
    },
  ].filter(Boolean) as any[];

  return {
    title: advertisement.name,
    broadstreet_id: advertisement.broadstreet_id,
    mongo_id: advertisement.mongo_id,
    entityType: 'advertisement' as const,
    imageUrl: advertisement.active?.url || undefined,
    subtitle: `Type: ${advertisement.type}`,
    statusBadge: advertisement.active_placement
      ? { label: 'Live', variant: 'success' as const }
      : { label: 'Inactive', variant: 'secondary' as const },
    topTags: [],
    parentsBreadcrumb,
    displayData: [
      { label: 'Type', value: advertisement.type, type: 'string' as const },
      { label: 'Last Updated', value: new Date(advertisement.updated_at), type: 'date' as const },
      { label: 'Preview', value: advertisement.preview_url, type: 'string' as const },
    ],
    showCheckbox: true,
    isSelected,
    onSelect: () => toggleSelection(selectionId),
    onCardClick: () => toggleSelection(selectionId),
    // Remove external preview URL navigation - only sync points and modal URLs allowed
    actionButtons: [],
  };
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
            const selectionId = String(getEntityId(advertisement));
            const isSelected = selectedAdvertisements.includes(selectionId);
            return (
              <UniversalEntityCard
                key={advertisement._id || String(advertisement.broadstreet_id)}
                {...mapAdToUniversalProps(
                  advertisement,
                  isSelected,
                  toggleAdvertisementSelection,
                  { network: entities.network, advertiser: entities.advertiser }
                )}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
