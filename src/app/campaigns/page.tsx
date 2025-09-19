/**
 * CAMPAIGNS PAGE - SERVER-SIDE PATTERN WITH ZUSTAND INTEGRATION
 *
 * Server page that fetches campaigns data and passes to client component
 * for Zustand store initialization. Follows the server-client pattern
 * established in Phase 2 (Dashboard, Networks, Advertisers, Zones).
 * All variable names follow docs/variable-origins.md registry.
 */

import { Suspense } from 'react';
import { fetchCampaigns, fetchNetworks, fetchAdvertisers } from '@/lib/server/data-fetchers';
import CreationButton from '@/components/creation/CreationButton';
import CampaignsClient from './CampaignsClient';
import LoadingSkeleton from './LoadingSkeleton';

/**
 * CampaignsPage - Server component that fetches data and renders client
 * Variable names follow docs/variable-origins.md registry
 */
export default async function CampaignsPage({ searchParams }: { searchParams: any }) {
  // Await searchParams for Next.js 15 compatibility
  const params = await searchParams;

  // Extract filters from parameters
  const networkId = params?.network ? parseInt(params.network) : null;
  const advertiserId = params?.advertiser ? parseInt(params.advertiser) : null;

  // Fetch campaigns, networks, and advertisers data in parallel using existing data fetchers
  const [campaigns, networks, advertisers] = await Promise.all([
    fetchCampaigns(advertiserId, { ...params, networkId }),
    fetchNetworks(),
    fetchAdvertisers(networkId)
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Campaigns</h1>
          <p className="card-text text-gray-600 mt-1">
            Active advertising campaigns and their details
          </p>
        </div>

        <Suspense fallback={<div className="bg-gray-200 animate-pulse h-10 w-32 rounded-lg"></div>}>
          <CreationButton />
        </Suspense>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <CampaignsClient
          initialCampaigns={campaigns}
          initialNetworks={networks}
          initialAdvertisers={advertisers}
          searchParams={params}
        />
      </Suspense>
    </div>
  );
}



