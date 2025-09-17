'use client';

import { Suspense, useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFilters } from '@/contexts/FilterContext';
import { useSelectedEntities } from '@/lib/hooks/use-selected-entities';
import { getEntityId } from '@/lib/utils/entity-helpers';
import CreationButton from '@/components/creation/CreationButton';
import { SearchInput } from '@/components/ui/search-input';
import { UniversalEntityCard } from '@/components/ui/universal-entity-card';

// Type for advertiser data from filter context
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

// Map advertiser to universal card props
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

function LoadingSkeleton() {
  return (
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
  );
}

function AdvertisersList() {
  const entities = useSelectedEntities();
  const { selectedAdvertiser, setSelectedAdvertiser, advertisers, isLoadingAdvertisers, setAdvertisers } = useFilters();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const router = useRouter();

  // Ensure fresh data on mount to avoid stale cached list after sync
  const selectedNetworkId = useMemo(() => getEntityId(entities.network as any), [entities.network]);

  useEffect(() => {
    const controller = new AbortController();
    const refresh = async () => {
      if (selectedNetworkId == null) return;
      try {
        const listRes = await fetch(`/api/advertisers?network_id=${selectedNetworkId}`, { cache: 'no-store', signal: controller.signal });
        if (listRes.ok) {
          const listData = await listRes.json();
          setAdvertisers(listData.advertisers || []);
        }
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          // Swallow non-critical errors; user can retry manually
          console.info('Advertisers refresh aborted or failed');
        }
      }
    };
    refresh();
    return () => controller.abort();
  }, [selectedNetworkId]);

  const filteredAdvertisers = useMemo(() => {
    if (!searchTerm.trim()) {
      return advertisers;
    }
    
    return advertisers.filter(advertiser =>
      advertiser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (advertiser.web_home_url && advertiser.web_home_url.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (advertiser.notes && advertiser.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (advertiser.admins && advertiser.admins.some(admin => 
        admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchTerm.toLowerCase())
      ))
    );
  }, [advertisers, searchTerm]);

  if (isLoadingAdvertisers) {
    return <LoadingSkeleton />;
  }

  // Check if network is selected
  if (!entities.network) {
    return (
      <div className="text-center py-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="card-title text-yellow-800 mb-2">Network Required</h3>
          <p className="card-text text-yellow-700 mb-4">
            Please select a network from the sidebar filters to view advertisers.
          </p>
          <p className="card-text text-yellow-600">
            Advertisers are specific to each network, so you need to choose which network&apos;s advertisers you want to see.
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
      setSelectedAdvertiser(advertiser);
    }
  };

  const handleDelete = async (advertiser: AdvertiserLean) => {
    const advId = getEntityId(advertiser);
    if (advId == null) {
      alert('Missing advertiser ID. Cannot delete.');
      return;
    }
    setIsDeleting(String(advId));
    try {
      const response = await fetch(`/api/delete/advertiser/${advId}` , {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete advertiser');
      }

      // Reload advertisers for the current network so the list updates immediately
      try {
        const netId = getEntityId(entities.network as any);
        if (netId != null) {
          const listRes = await fetch(`/api/advertisers?network_id=${netId}`, { cache: 'no-store' });
          if (listRes.ok) {
            const listData = await listRes.json();
            setAdvertisers(listData.advertisers || []);
          }
        }
      } catch (e) {
        console.info('Post-delete advertisers reload failed; falling back to refresh');
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
                  parentNetwork: entities.network,
                })}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AdvertisersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Advertisers</h1>
          <p className="card-text text-gray-600 mt-1">
            Companies running advertising campaigns
          </p>
        </div>
        
        <Suspense fallback={<div className="bg-gray-200 animate-pulse h-10 w-32 rounded-lg"></div>}>
          <CreationButton />
        </Suspense>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <AdvertisersList />
      </Suspense>
    </div>
  );
}
