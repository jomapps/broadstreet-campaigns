import { Suspense } from 'react';
import { fetchNetworks } from '@/lib/server/data-fetchers';
import NetworksClient from './NetworksClient';
import LoadingSkeleton from './LoadingSkeleton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface NetworksPageProps {
  searchParams: Promise<{
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  }>;
}

export default async function NetworksPage({ searchParams }: NetworksPageProps) {
  // 1. Await searchParams
  const params = await searchParams;

  // 2. Fetch networks with search/sort parameters
  const networks = await fetchNetworks(params);

  // 3. Pass to client
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Networks</h1>
          <p className="card-text text-gray-600 mt-1">
            Manage your advertising networks
          </p>
        </div>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <NetworksClient
          initialNetworks={networks}
          searchParams={params}
        />
      </Suspense>
    </div>
  );
}
