'use client';

import { Suspense, useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFilters } from '@/contexts/FilterContext';
import { useSelectedEntities } from '@/lib/hooks/use-selected-entities';
import { getEntityId } from '@/lib/utils/entity-helpers';
import { EntityIdBadge } from '@/components/ui/entity-id-badge';
import CreationButton from '@/components/creation/CreationButton';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { SearchInput } from '@/components/ui/search-input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cardStateClasses } from '@/lib/ui/cardStateClasses';

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

interface AdvertiserCardProps {
  advertiser: AdvertiserLean;
  isSelected: boolean;
  onSelect: (advertiser: AdvertiserLean) => void;
  onDelete?: (advertiser: AdvertiserLean) => void;
}

function AdvertiserCard({ advertiser, isSelected, onSelect, onDelete }: AdvertiserCardProps) {
  const isLocal = advertiser.created_locally && !advertiser.synced_with_api;
  const slug = advertiser.name.replace(/\s+/g, '-').toLowerCase();
  
  const handleDelete = async () => {
    if (!onDelete) return;
    
    if (!confirm(`Are you sure you want to delete "${advertiser.name}"? This action cannot be undone.`)) {
      return;
    }
    
    onDelete(advertiser);
  };
  
  return (
    <div
      className={`relative rounded-lg shadow-sm border-2 p-6 transition-all duration-200 ${cardStateClasses({ isLocal: !!isLocal, isSelected })}`}
      data-testid="advertiser-card"
      data-advertiser-slug={slug}
    >
      {/* Delete Button for Local Entities */}
      {isLocal && onDelete && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
          onClick={handleDelete}
          data-testid="delete-button"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onSelect(advertiser)}
              className="mt-1"
            />
            {advertiser.logo?.url && (
              <img
                src={advertiser.logo.url}
                alt={`${advertiser.name} logo`}
                className="w-8 h-8 rounded object-cover"
              />
            )}
            <h3 className="card-title text-gray-900" data-testid="advertiser-name">{advertiser.name}</h3>
          </div>
          
          {advertiser.web_home_url && (
            <a
              href={advertiser.web_home_url}
              target="_blank"
              rel="noopener noreferrer"
              className="card-text text-blue-600 hover:text-blue-800 mt-2 inline-block"
            >
              {advertiser.web_home_url}
            </a>
          )}
        </div>
        
        <div className="flex flex-col items-end space-y-1">
          {isSelected && (
            <Badge variant="default" className="text-xs px-2 py-1">
              Selected
            </Badge>
          )}
          {advertiser.created_locally && !advertiser.synced_with_api && (
            <Badge variant="secondary" className="text-xs px-2 py-1 bg-orange-100 text-orange-800">
              Local
            </Badge>
          )}
          <EntityIdBadge
            broadstreet_id={advertiser.broadstreet_id}
            mongo_id={advertiser.mongo_id}
          />
        </div>
      </div>
      
      {advertiser.notes && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="card-text text-gray-600">Notes</p>
          <p className="card-text text-gray-900 mt-1">{advertiser.notes}</p>
        </div>
      )}
      
      {advertiser.admins && advertiser.admins.length > 0 && (
        <div>
          <p className="card-text text-gray-600 mb-2">Admins</p>
          <div className="space-y-1">
            {advertiser.admins.map((admin, index) => (
              <div key={index} className="flex items-center justify-between card-text">
                <span className="text-gray-900">{admin.name}</span>
                <a
                  href={`mailto:${admin.email}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {admin.email}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
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
    const currentId = (selectedAdvertiser as any)?.broadstreet_id ?? (selectedAdvertiser as any)?.mongo_id ?? (selectedAdvertiser as any)?.name;
    const nextId = advertiser.broadstreet_id ?? advertiser.mongo_id ?? advertiser.name;
    if (String(currentId ?? '') === String(nextId ?? '')) {
      setSelectedAdvertiser(null);
    } else {
      setSelectedAdvertiser(advertiser);
    }
  };

  const handleDelete = async (advertiser: AdvertiserLean) => {
    const advId = advertiser.broadstreet_id ?? advertiser.mongo_id;
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
          {filteredAdvertisers.map((advertiser) => (
            <AdvertiserCard 
              key={String(advertiser.broadstreet_id ?? advertiser.mongo_id ?? advertiser.name)}
              advertiser={advertiser}
              isSelected={
                String(getEntityId(selectedAdvertiser as any)) === String(advertiser.broadstreet_id ?? advertiser.mongo_id ?? advertiser.name)
              }
              onSelect={handleAdvertiserSelect}
              onDelete={handleDelete}
            />
          ))}
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
