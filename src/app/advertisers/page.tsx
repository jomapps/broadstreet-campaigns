import { Suspense } from 'react';
import { fetchAdvertisers, fetchNetworks } from '@/lib/server/data-fetchers';
import CreationButton from '@/components/creation/CreationButton';
import AdvertisersClient from './AdvertisersClient';
import LoadingSkeleton from './LoadingSkeleton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface AdvertisersPageProps {
  searchParams: Promise<{
    network?: string;
    search?: string;
    status?: string;
    page?: string;
    limit?: string;
  }>;
}


export default async function AdvertisersPage({ searchParams }: AdvertisersPageProps) {
  // 1. Await searchParams
  const params = await searchParams;

  // 2. Parse parameters
  const networkId = params.network ? parseInt(params.network) : undefined;

  // 3. Fetch data
  const [advertisers, networks] = await Promise.all([
    fetchAdvertisers(networkId, params),
    fetchNetworks(),
  ]);

  // 4. Pass to client
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Advertisers</h1>
          <p className="card-text text-gray-600 mt-1">
            Manage advertisers across your networks
          </p>
        </div>

        <Suspense fallback={<div className="bg-gray-200 animate-pulse h-10 w-32 rounded-lg"></div>}>
          <CreationButton />
        </Suspense>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <AdvertisersClient
          initialAdvertisers={advertisers}
          initialNetworks={networks}
          searchParams={params}
        />
      </Suspense>
    </div>
  );
}
