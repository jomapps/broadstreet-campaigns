/**
 * NETWORKS CONTENT - MAIN NETWORKS UI
 * 
 * Main networks content component that displays networks grid and handles interactions.
 * Reads data from Zustand stores and provides network selection functionality.
 * All variable names follow docs/variable-origins.md registry.
 */

'use client';

import { Suspense } from 'react';
import { useEntityStore, useFilterStore } from '@/stores';
import { getEntityId } from '@/lib/utils/entity-helpers';
import { UniversalEntityCard } from '@/components/ui/universal-entity-card';
import CreationButton from '@/components/creation/CreationButton';

// Type for network data from Zustand store
type NetworkLean = {
  broadstreet_id: number;
  name: string;
  group_id?: number | null;
  web_home_url?: string;
  logo?: { url: string };
  valet_active: boolean;
  path: string;
  advertiser_count?: number;
  zone_count?: number;
};

/**
 * Map network to universal card props
 * Variable names follow docs/variable-origins.md registry
 */
function mapNetworkToUniversalProps(network: NetworkLean, isSelected: boolean, toggleSelect: (n: NetworkLean) => void) {
  return {
    title: network.name,
    broadstreet_id: network.broadstreet_id,
    mongo_id: (network as any).mongo_id,
    entityType: 'network' as const,
    imageUrl: network.logo?.url,
    titleUrl: network.path,
    showCheckbox: true,
    isSelected,
    onSelect: () => toggleSelect(network),
    onCardClick: () => toggleSelect(network),
    topTags: network.valet_active ? [{ label: 'Valet Active', variant: 'secondary' as const }] : [],
    displayData: [
      { label: 'Advertisers', value: network.advertiser_count ?? 0, type: 'number' as const },
      { label: 'Zones', value: network.zone_count ?? 0, type: 'number' as const },
      ...(network.web_home_url ? [{ label: 'Website', value: network.web_home_url, type: 'string' as const }] : []),
    ],
  };
}

/**
 * NetworksList - Networks grid component
 * Variable names follow docs/variable-origins.md registry
 */
function NetworksList() {
  // Get data from Zustand stores using exact names from docs/variable-origins.md registry
  const { networks, isLoading } = useEntityStore();
  const { selectedNetwork, setSelectedNetwork } = useFilterStore();

  if (isLoading.networks) {
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
                <div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (networks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No networks found. Try syncing data first.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {networks.map((network) => {
        const isSelected = getEntityId(selectedNetwork) === getEntityId(network);
        const toggle = (n: NetworkLean) => {
          if (getEntityId(selectedNetwork) === getEntityId(n)) {
            setSelectedNetwork(null);
          } else {
            setSelectedNetwork(n as any);
          }
        };
        return (
          <UniversalEntityCard
            key={getEntityId(network)}
            {...mapNetworkToUniversalProps(network, isSelected, toggle)}
          />
        );
      })}
    </div>
  );
}

/**
 * NetworksContent - Main networks content component
 * Variable names follow docs/variable-origins.md registry
 */
export default function NetworksContent() {
  return (
    <div className="space-y-8">
      {/* Networks Grid */}
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="card-title">Available Networks</h2>
          <p className="card-text text-muted-foreground">Manage and view all your advertising networks</p>
        </div>
        
        <NetworksList />
      </div>

      <CreationButton />
    </div>
  );
}
