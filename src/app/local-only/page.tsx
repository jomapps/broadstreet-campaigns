import { Suspense } from 'react';
import connectDB from '@/lib/mongodb';
import LocalZone from '@/lib/models/local-zone';
import LocalAdvertiser from '@/lib/models/local-advertiser';
import LocalCampaign from '@/lib/models/local-campaign';
import LocalNetwork from '@/lib/models/local-network';
import LocalAdvertisement from '@/lib/models/local-advertisement';
import Network from '@/lib/models/network';
import Advertiser from '@/lib/models/advertiser';
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

async function LocalOnlyData() {
  try {
    await connectDB();
    
    // Fetch all local entities that haven't been synced
    const [localZones, localAdvertisers, localCampaigns, localNetworks, localAdvertisements] = await Promise.all([
      LocalZone.find({ synced_with_api: false }).sort({ created_at: -1 }).lean() as LocalEntity[],
      LocalAdvertiser.find({ synced_with_api: false }).sort({ created_at: -1 }).lean() as LocalEntity[],
      LocalCampaign.find({ synced_with_api: false }).sort({ created_at: -1 }).lean() as LocalEntity[],
      LocalNetwork.find({ synced_with_api: false }).sort({ created_at: -1 }).lean() as LocalEntity[],
      LocalAdvertisement.find({ synced_with_api: false }).sort({ created_at: -1 }).lean() as LocalEntity[],
    ]);
    
    // Get network names for display
    const networkIds = [...new Set([
      ...localZones.map(z => z.network_id),
      ...localAdvertisers.map(a => a.network_id),
      ...localCampaigns.map(c => c.network_id),
      ...localNetworks.map(n => n.id),
      ...localAdvertisements.map(ad => ad.network_id),
    ])];
    
    const networks = await Network.find({ id: { $in: networkIds } }).lean();
    const networkMap = new Map(networks.map(n => [n.id, n.name]));

    // Get advertiser names for display (both local and synced advertisers)
    const advertiserIds = [...new Set([
      ...localCampaigns.map(c => c.advertiser_id),
      ...localAdvertisers.map(a => a._id), // Local advertisers use _id
    ])].filter(id => id !== undefined && id !== null);
    
    // Fetch both local and synced advertisers
    const [localAdvertisersForNames, syncedAdvertisers] = await Promise.all([
      LocalAdvertiser.find({ synced_with_api: false }).lean(),
      Advertiser.find({ id: { $in: advertiserIds } }).lean(),
    ]);
    
    // Create advertiser map (local advertisers use their _id, synced use Broadstreet ID)
    const advertiserMap = new Map([
      ...localAdvertisersForNames.map(a => [a._id, a.name]),
      ...syncedAdvertisers.map(a => [a.id, a.name]),
    ]);

    // Serialize the data
    const serializedData = {
      zones: localZones.map(zone => ({
        ...zone,
        _id: zone._id.toString(),
        created_at: zone.created_at.toISOString(),
        type: 'zone' as const,
      })),
      advertisers: localAdvertisers.map(advertiser => ({
        ...advertiser,
        _id: advertiser._id.toString(),
        created_at: advertiser.created_at.toISOString(),
        type: 'advertiser' as const,
      })),
      campaigns: localCampaigns.map(campaign => ({
        ...campaign,
        _id: campaign._id.toString(),
        created_at: campaign.created_at.toISOString(),
        type: 'campaign' as const,
      })),
      networks: localNetworks.map(network => ({
        ...network,
        _id: network._id.toString(),
        created_at: network.created_at.toISOString(),
        type: 'network' as const,
      })),
      advertisements: localAdvertisements.map(advertisement => ({
        ...advertisement,
        _id: advertisement._id.toString(),
        created_at: advertisement.created_at.toISOString(),
        type: 'advertisement' as const,
      })),
    };

    return <LocalOnlyDashboard data={serializedData} networkMap={networkMap} advertiserMap={advertiserMap} />;
  } catch (error) {
    console.error('Error loading local entities data:', error);
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Error loading local entities. Please try again.</p>
      </div>
    );
  }
}

export default function LocalOnlyPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Local Only</h1>
          <p className="text-gray-600 mt-1">
            Manage locally created entities before syncing to Broadstreet
          </p>
        </div>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <LocalOnlyData />
      </Suspense>
    </div>
  );
}
