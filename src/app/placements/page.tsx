/**
 * PLACEMENTS PAGE - SERVER-SIDE PATTERN WITH ZUSTAND INTEGRATION
 *
 * Server page that fetches placements data and passes to client component
 * for Zustand store initialization. Follows the server-client pattern
 * established in Phase 2 (Dashboard, Networks, Advertisers, Zones, Campaigns, Advertisements).
 * All variable names follow docs/variable-origins.md registry.
 */

import { Suspense } from 'react';
import { fetchNetworks, fetchAdvertisers, fetchCampaigns } from '@/lib/server/data-fetchers';
import { Button } from '@/components/ui/button';
import PlacementsClient from './PlacementsClient';
import LoadingSkeleton from './LoadingSkeleton';

/**
 * PlacementsPage - Server component that fetches data and renders client
 * Variable names follow docs/variable-origins.md registry
 */
export default async function PlacementsPage({ searchParams }: { searchParams: any }) {
  // Await searchParams for Next.js 15 compatibility
  const params = await searchParams;

  // Extract filters from parameters
  const networkId = params?.network ? parseInt(params.network) : null;
  const advertiserId = params?.advertiser ? parseInt(params.advertiser) : null;
  const campaignId = params?.campaign ? parseInt(params.campaign) : null;

  // For now, use empty placements array - will be loaded client-side
  // TODO: Create server-side enriched placement fetcher
  const placements: any[] = [];

  // Fetch related data in parallel using existing data fetchers
  const [networks, advertisers, campaigns] = await Promise.all([
    fetchNetworks(),
    fetchAdvertisers(networkId || undefined),
    fetchCampaigns(advertiserId || undefined, params)
  ]);

  return (
    <div className="space-y-6" data-testid="placements-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Placements</h1>
          <p className="card-text text-gray-600 mt-1">
            Active ad placements across campaigns, advertisements, and zones
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4" data-testid="placements-overview">
        <h2 className="card-title text-gray-900 mb-3">Placement Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 card-text">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <span>Advertisement + Zone + Campaign</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>Active Campaigns Only</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            <span>Network Filtered</span>
          </div>
        </div>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <div data-testid="placements-data">
          <PlacementsClient
            initialPlacements={placements}
            initialNetworks={networks}
            initialAdvertisers={advertisers}
            initialCampaigns={campaigns}
            searchParams={params}
          />
        </div>
      </Suspense>
    </div>
  );
}


