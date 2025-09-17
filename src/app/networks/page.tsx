'use client';

import { Suspense } from 'react';
import { useFilters } from '@/contexts/FilterContext';
import CreationButton from '@/components/creation/CreationButton';
import { getEntityId } from '@/lib/utils/entity-helpers';
import { UniversalEntityCard } from '@/components/ui/universal-entity-card';

// Type for network data from filter context
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

// Map network to universal card props
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

function NetworksList() {
  const { networks, isLoadingNetworks, selectedNetwork, setSelectedNetwork } = useFilters();

  if (isLoadingNetworks) {
    return <LoadingSkeleton />;
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

export default function NetworksPage() {
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Networks</h1>
            <p className="card-text text-muted-foreground">
              Different websites where campaigns are run
            </p>
          </div>
          
          <Suspense fallback={<div className="bg-muted animate-pulse h-10 w-32 rounded-lg"></div>}>
            <CreationButton />
          </Suspense>
        </div>
      </div>

      {/* Networks Grid */}
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="card-title">Available Networks</h2>
          <p className="card-text text-muted-foreground">Manage and view all your advertising networks</p>
        </div>
        
        <Suspense fallback={<LoadingSkeleton />}>
          <NetworksList />
        </Suspense>
      </div>

      <CreationButton />
    </div>
  );
}
