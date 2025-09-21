import { Suspense } from 'react';
import { 
  fetchNetworks, 
  fetchAdvertisers, 
  fetchCampaigns, 
  fetchZones, 
  fetchAdvertisements 
} from '@/lib/server/data-fetchers';
import CreatePlacementsClient from './CreatePlacementsClient';
import LoadingSkeleton from './LoadingSkeleton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface CreatePlacementsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CreatePlacementsPage({ searchParams }: CreatePlacementsPageProps) {
  // 1. Await searchParams (Next.js 15 requirement)
  const params = await searchParams;
  
  // 2. Fetch necessary data server-side for entity resolution
  const [networks, advertisers, campaigns, zones, advertisements] = await Promise.all([
    fetchNetworks(),
    fetchAdvertisers(undefined),
    fetchCampaigns(undefined),
    fetchZones(undefined),
    fetchAdvertisements(undefined),
  ]);
  
  // 3. Pass data to client component
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Create Placements</h1>
          <p className="card-text text-gray-600 mt-1">
            Create placements with size type categorization (SQ, LS, PT)
          </p>
        </div>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <CreatePlacementsClient 
          initialData={{
            networks,
            advertisers,
            campaigns,
            zones,
            advertisements
          }}
        />
      </Suspense>
    </div>
  );
}
