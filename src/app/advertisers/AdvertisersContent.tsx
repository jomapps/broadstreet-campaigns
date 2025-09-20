/**
 * ADVERTISERS CONTENT - MAIN ADVERTISERS UI
 * 
 * Main advertisers content component that displays advertisers grid and handles interactions.
 * Reads data from Zustand stores and provides advertiser selection and management functionality.
 * All variable names follow docs/variable-origins.md registry.
 */

'use client';

import { Suspense, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useEntityStore, useFilterStore } from '@/stores';
import { useDeferredAdvertisersFilter } from '@/lib/hooks/use-deferred-advertisers-filter';
import { getEntityId } from '@/lib/utils/entity-helpers';
import { UniversalEntityCard } from '@/components/ui/universal-entity-card';
import { SearchInput } from '@/components/ui/search-input';
import CreationButton from '@/components/creation/CreationButton';
import { FilterLoadingOverlay } from '@/components/ui/filter-loading-overlay';

// Type for advertiser data from Zustand store
type AdvertiserLean = {
  broadstreet_id?: number;
  mongo_id?: string;
  name: string;
  logo?: { url: string };
  web_home_url?: string;
  notes?: string | null;
  admins?: Array<{ name: string; email: string }>;
  created_locally?: boolean;
  synced_with_api?: boolean;
};

/**
 * Map advertiser to universal card props
 * Variable names follow docs/variable-origins.md registry
 */
function mapAdvertiserToUniversalProps(
  advertiser: AdvertiserLean,
  params: {
    isSelected: boolean;
    onSelect: (a: AdvertiserLean) => void;
    onDelete?: (a: AdvertiserLean) => void;
    parentNetwork?: any;
  }
) {
  const isLocal = !!(advertiser.created_locally && !advertiser.synced_with_api);
  const parent = params.parentNetwork;
  const parentsBreadcrumb = parent
    ? [{
        name: String(parent?.name ?? 'Network'),
        broadstreet_id: typeof parent?.broadstreet_id === 'number' ? parent.broadstreet_id : undefined,
        mongo_id: parent?.mongo_id ?? parent?._id,
        entityType: 'network' as const,
      }]
    : [];

  return {
    title: advertiser.name,
    broadstreet_id: advertiser.broadstreet_id,
    mongo_id: advertiser.mongo_id,
    entityType: 'advertiser' as const,
    imageUrl: advertiser.logo?.url,
    showCheckbox: true,
    isSelected: params.isSelected,
    onSelect: () => params.onSelect(advertiser),
    onCardClick: () => params.onSelect(advertiser),
    isLocal,
    onDelete: isLocal && params.onDelete ? () => params.onDelete!(advertiser) : undefined,
    parentsBreadcrumb,
    displayData: [
      ...(advertiser.web_home_url ? [{ label: 'Website', value: advertiser.web_home_url, type: 'string' as const }] : []),
      ...(Array.isArray(advertiser.admins) ? [{ label: 'Admins', value: advertiser.admins.length, type: 'number' as const }] : []),
      ...(advertiser.notes ? [{ label: 'Notes', value: advertiser.notes, type: 'string' as const }] : []),
    ],
  };
}

/**
 * AdvertisersList - Advertisers grid component
 * Variable names follow docs/variable-origins.md registry
 */
function AdvertisersList() {
  // Get data from Zustand stores using exact names from docs/variable-origins.md registry
  const { advertisers, networks, isLoading } = useEntityStore();
  const { selectedAdvertiser, setSelectedAdvertiser, selectedNetwork } = useFilterStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const router = useRouter();

  // Use deferred filtering for better performance with loading states
  const { filteredAdvertisers, isFiltering, filterCount } = useDeferredAdvertisersFilter({
    advertisers,
    searchTerm
  });

  if (isLoading.advertisers) {
    return (
      <div className="space-y-6">
        <div className="max-w-md">
          <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="animate-pulse">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-16 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Check if network is selected
  if (!selectedNetwork) {
    return (
      <div className="text-center py-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="card-title text-yellow-800 mb-2">Network Required</h3>
          <p className="card-text text-yellow-700 mb-4">
            Please select a network from the sidebar filters to view advertisers.
          </p>
          <p className="card-text text-yellow-600">
            Advertisers are specific to each network, so you need to choose which network's advertisers you want to see.
          </p>
        </div>
      </div>
    );
  }

  if (advertisers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No advertisers found for the selected network. Try syncing data first.</p>
      </div>
    );
  }

  const handleAdvertiserSelect = (advertiser: AdvertiserLean) => {
    const currentId = getEntityId(selectedAdvertiser);
    const nextId = getEntityId(advertiser);
    if (String(currentId ?? '') === String(nextId ?? '')) {
      setSelectedAdvertiser(null);
    } else {
      setSelectedAdvertiser(advertiser as any);
    }
  };

  const handleDelete = async (advertiser: AdvertiserLean) => {
    const advId = getEntityId(advertiser);
    if (advId == null) {
      alert('Missing advertiser ID. Cannot delete.');
      return;
    }
    
    const confirmed = confirm(`Are you sure you want to delete "${advertiser.name}"?`);
    if (!confirmed) return;

    setIsDeleting(String(advId));
    try {
      const response = await fetch(`/api/delete/advertiser/${advId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete advertiser');
      }

      // Clear selection if deleted advertiser was selected
      if (String(getEntityId(selectedAdvertiser)) === String(advId)) {
        setSelectedAdvertiser(null);
      }

      // Soft refresh for any server components
      router.refresh();
    } catch (error) {
      console.error('Error deleting advertiser:', error);
      alert('Failed to delete advertiser. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-6" data-testid="advertisers-list">
      <div className="max-w-md">
        <SearchInput
          placeholder="Search advertisers..."
          value={searchTerm}
          onChange={setSearchTerm}
        />
      </div>
      
      {filteredAdvertisers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No advertisers match your search.</p>
        </div>
      ) : (
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAdvertisers.map((advertiser) => {
              const isSelected = String(getEntityId(selectedAdvertiser)) === String(getEntityId(advertiser));
              return (
                <UniversalEntityCard
                  key={String(getEntityId(advertiser))}
                  {...mapAdvertiserToUniversalProps(advertiser, {
                    isSelected,
                    onSelect: handleAdvertiserSelect,
                    onDelete: handleDelete,
                    parentNetwork: selectedNetwork,
                  })}
                />
              );
            })}
          </div>

          {/* Loading overlay during filtering operations */}
          <FilterLoadingOverlay
            isVisible={isFiltering}
            filterCount={filterCount}
            totalCount={advertisers?.length}
            entityType="advertisers"
          />
        </div>
      )}
    </div>
  );
}

/**
 * AdvertisersContent - Main advertisers content component
 * Variable names follow docs/variable-origins.md registry
 */
export default function AdvertisersContent() {
  return (
    <div className="space-y-6">
      <AdvertisersList />
    </div>
  );
}
