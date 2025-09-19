/**
 * ADVERTISEMENTS PAGE - SERVER-SIDE PATTERN WITH ZUSTAND INTEGRATION
 *
 * Server page that fetches advertisements data and passes to client component
 * for Zustand store initialization. Follows the server-client pattern
 * established in Phase 2 (Dashboard, Networks, Advertisers, Zones, Campaigns).
 * All variable names follow docs/variable-origins.md registry.
 */

import { Suspense } from 'react';
import { fetchAdvertisements, fetchNetworks, fetchAdvertisers } from '@/lib/server/data-fetchers';
import CreationButton from '@/components/creation/CreationButton';
import AdvertisementsClient from './AdvertisementsClient';
import LoadingSkeleton from './LoadingSkeleton';


/**
 * AdvertisementsPage - Server component that fetches data and renders client
 * Variable names follow docs/variable-origins.md registry
 */
export default async function AdvertisementsPage({ searchParams }) {
  // Await searchParams for Next.js 15 compatibility
  const params = await searchParams;

  // Extract filters from parameters
  const networkId = params?.network ? parseInt(params.network) : null;
  const advertiserId = params?.advertiser ? parseInt(params.advertiser) : null;

  // Fetch advertisements, networks, and advertisers data in parallel using existing data fetchers
  const [advertisements, networks, advertisers] = await Promise.all([
    fetchAdvertisements(advertiserId, params),
    fetchNetworks(),
    fetchAdvertisers(networkId)
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Advertisements</h1>
          <p className="card-text text-gray-600 mt-1">
            Actual ads shown on your websites
          </p>
        </div>

        <Suspense fallback={<div className="bg-gray-200 animate-pulse h-10 w-32 rounded-lg"></div>}>
          <CreationButton />
        </Suspense>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h2 className="card-title text-gray-900 mb-2">Advertisement Types</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 card-text">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
            <span>Image</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            <span>Text</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
            <span>Video</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
            <span>Native</span>
          </div>
        </div>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <AdvertisementsClient
          initialAdvertisements={advertisements}
          initialNetworks={networks}
          initialAdvertisers={advertisers}
          searchParams={params}
        />
      </Suspense>

      <CreationButton />
    </div>
  );
}


