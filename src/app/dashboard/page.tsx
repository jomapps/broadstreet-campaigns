import { Suspense } from 'react';
import { fetchNetworks, fetchAdvertisers, fetchZones, fetchCampaigns, getEntityCounts } from '@/lib/server/data-fetchers';
import DashboardClient from './DashboardClient';
import LoadingSkeleton from './LoadingSkeleton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface DashboardPageProps {
  searchParams: Promise<{
    network?: string;
    advertiser?: string;
    campaign?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  // 1. Await searchParams (Next.js 15 requirement)
  const params = await searchParams;

  // 2. Parse parameters
  const networkId = params.network ? parseInt(params.network) : undefined;
  const advertiserId = params.advertiser ? parseInt(params.advertiser) : undefined;
  const page = parseInt(params.page || '1');
  const limit = parseInt(params.limit || '20');

  // 3. Fetch data based on parameters
  const [networks, advertisers, zones, campaigns, entityCounts] = await Promise.all([
    fetchNetworks(),
    fetchAdvertisers(networkId),
    fetchZones(networkId),
    fetchCampaigns(advertiserId, { networkId }),
    getEntityCounts(networkId),
  ]);

  // 4. Pass to client
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="card-text text-gray-600 mt-1">
            Overview of your Broadstreet campaigns and performance
          </p>
        </div>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <DashboardClient
          initialNetworks={networks}
          initialAdvertisers={advertisers}
          initialZones={zones}
          initialCampaigns={campaigns}
          initialEntityCounts={entityCounts}
          searchParams={params}
        />
      </Suspense>
    </div>
  );
}
