/**
 * ZONES PAGE - SERVER-SIDE PATTERN WITH ZUSTAND INTEGRATION
 *
 * Server page that fetches zones data and passes to client component
 * for Zustand store initialization. Follows the server-client pattern
 * established in Phase 2 (Dashboard, Networks, Advertisers).
 * All variable names follow docs/variable-origins.md registry.
 */

import { Suspense } from 'react';
import { fetchZones, fetchNetworks } from '@/lib/server/data-fetchers';
import CreationButton from '@/components/creation/CreationButton';
import ZonesClient from './ZonesClient';
import LoadingSkeleton from './LoadingSkeleton';


/**
 * Props interface for ZonesPage
 * Variable names follow docs/variable-origins.md registry
 */
interface ZonesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * ZonesPage - Server component that fetches data and renders client
 * Variable names follow docs/variable-origins.md registry
 */
export default async function ZonesPage({ searchParams }: ZonesPageProps) {
  // Await searchParams for Next.js 15 compatibility
  const params = await searchParams;

  // Extract network filter from parameters
  const networkId = params?.network ? parseInt(params.network) : null;

  // Fetch zones and networks data in parallel using existing data fetchers
  const [zones, networks] = await Promise.all([
    fetchZones(networkId, params),
    fetchNetworks()
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Zones</h1>
          <p className="card-text text-gray-600 mt-1">
            Possible ad placements across your networks
          </p>
        </div>

        <Suspense fallback={<div className="bg-gray-200 animate-pulse h-10 w-32 rounded-lg"></div>}>
          <CreationButton />
        </Suspense>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <ZonesClient
          initialZones={zones}
          initialNetworks={networks}
          searchParams={params}
        />
      </Suspense>
    </div>
  );
}


