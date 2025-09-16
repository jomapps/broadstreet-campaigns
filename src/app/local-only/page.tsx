import { Suspense } from 'react';
import connectDB from '@/lib/mongodb';
import LocalZone from '@/lib/models/local-zone';
import LocalAdvertiser from '@/lib/models/local-advertiser';
import LocalCampaign from '@/lib/models/local-campaign';
import LocalNetwork from '@/lib/models/local-network';
import LocalAdvertisement from '@/lib/models/local-advertisement';
import Network from '@/lib/models/network';
import Advertiser from '@/lib/models/advertiser';
import Placement from '@/lib/models/placement';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Users, Calendar, Globe, Image } from 'lucide-react';
import LocalOnlyDashboard from './LocalOnlyDashboard';

// Type for local entity data
type LocalEntity = {
  _id: string;
  name: string;
  network_id: number;
  created_at: Date;
  synced_with_api: boolean;
  [key: string]: any;
};

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="animate-pulse">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="w-12 h-6 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-16 bg-gray-200 rounded mb-4"></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                    <div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Removed unused server-side LocalOnlyData/LocalEntityCard to avoid dead code

export default function LocalOnlyPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Local Only</h1>
          <p className="card-text text-gray-600 mt-1">
            Manage locally created entities before syncing to Broadstreet
          </p>
        </div>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <LocalOnlyDataWrapper />
      </Suspense>
    </div>
  );
}

// Wrapper component to pass data to the client-side dashboard
async function LocalOnlyDataWrapper() {
  try {
    await connectDB();
    
    // Fetch all local entities that haven't been synced
    const [localZones, localAdvertisers, localCampaigns, localNetworks, localAdvertisements, localPlacements] = await Promise.all([
      LocalZone.find({ synced_with_api: false }).sort({ created_at: -1 }).lean(),
      LocalAdvertiser.find({ synced_with_api: false }).sort({ created_at: -1 }).lean(),
      // Include campaigns with placements regardless of synced status
      LocalCampaign.find({ $or: [ { synced_with_api: false }, { 'placements.0': { $exists: true } } ] }).sort({ created_at: -1 }).lean(),
      LocalNetwork.find({ synced_with_api: false }).sort({ created_at: -1 }).lean(),
      LocalAdvertisement.find({ synced_with_api: false }).sort({ created_at: -1 }).lean(),
      // Fetch local placements from the collection
      Placement.find({ created_locally: true }).sort({ created_at: -1 }).lean(),
    ]);
    
    // Also fetch locally created advertisers from the main Advertiser collection
    const mainLocalAdvertisers = await Advertiser.find({ 
      synced_with_api: false,
      created_locally: true 
    }).select('-id').sort({ created_at: -1 }).lean();
    
    // Convert main advertisers to LocalEntity format for display
    const convertedMainAdvertisers = mainLocalAdvertisers.map((advertiser: any) => ({
      _id: (advertiser as any)._id?.toString?.(),
      name: advertiser.name,
      network_id: advertiser.network_id,
      web_home_url: advertiser.web_home_url,
      notes: advertiser.notes,
      admins: advertiser.admins,
      created_locally: advertiser.created_locally,
      synced_with_api: advertiser.synced_with_api,
      created_at: advertiser.created_at || new Date(),
      type: 'advertiser' as const,
    }));
    
    // Combine local advertisers from both collections
    const allLocalAdvertisers = [...localAdvertisers, ...convertedMainAdvertisers];
    
    // Get network names for display
    const networkIds = [...new Set([
      ...localZones.map(z => z.network_id),
      ...allLocalAdvertisers.map(a => a.network_id),
      ...localCampaigns.map(c => c.network_id),
      ...localNetworks.map(n => n.id),
      ...localAdvertisements.map(ad => ad.network_id),
    ])];
    
    const networks = await Network.find({ id: { $in: networkIds } }).lean();
    const networkMap = new Map(networks.map(n => [n.id, n.name]));

    // Get advertiser names for display (only numeric Broadstreet IDs)
    const advertiserIds = [...new Set(
      localCampaigns
        .map(c => c.advertiser_id)
        .filter((id): id is number => typeof id === 'number')
    )];
    
    // Fetch synced advertisers that match those numeric IDs
    const syncedAdvertisers = await Advertiser.find({ id: { $in: advertiserIds } }).lean();
    
    // Map by numeric ID for campaign display lookups
    const advertiserMap = new Map<number, string>(
      syncedAdvertisers.map(a => [a.id, a.name])
    );

    // Serialize the data properly
    const serializedData = {
      zones: localZones.map((zone: any) => ({
        ...zone,
        _id: (zone as any)._id?.toString?.(),
        created_at: (zone as any).created_at?.toISOString?.(),
        type: 'zone' as const,
      })),
      advertisers: allLocalAdvertisers.map((advertiser: any) => ({
        ...advertiser,
        _id: (advertiser as any)._id?.toString?.(),
        created_at: (advertiser as any).created_at?.toISOString?.(),
        type: 'advertiser' as const,
      })),
      campaigns: localCampaigns.map((campaign: any) => ({
        ...campaign,
        _id: (campaign as any)._id?.toString?.(),
        created_at: (campaign as any).created_at?.toISOString?.(),
        type: 'campaign' as const,
      })),
      networks: localNetworks.map((network: any) => ({
        ...network,
        _id: (network as any)._id?.toString?.(),
        created_at: (network as any).created_at?.toISOString?.(),
        type: 'network' as const,
      })),
      advertisements: localAdvertisements.map((advertisement: any) => ({
        ...advertisement,
        _id: (advertisement as any)._id?.toString?.(),
        created_at: (advertisement as any).created_at?.toISOString?.(),
        type: 'advertisement' as const,
      })),
      placements: localPlacements.map((placement: any) => ({
        ...placement,
        _id: (placement as any)._id?.toString?.(),
        created_at: (placement as any).created_at?.toISOString?.(),
        type: 'placement' as const,
      })),
    };

    return (
      <LocalOnlyDashboard 
        data={serializedData}
        networkMap={networkMap}
        advertiserMap={advertiserMap}
      />
    );
  } catch (error) {
    console.error('Error loading local entities data:', error);
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Error loading local entities. Please try again.</p>
      </div>
    );
  }
}