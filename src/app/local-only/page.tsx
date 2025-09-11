import { Suspense } from 'react';
import connectDB from '@/lib/mongodb';
import LocalZone from '@/lib/models/local-zone';
import LocalAdvertiser from '@/lib/models/local-advertiser';
import LocalCampaign from '@/lib/models/local-campaign';
import LocalNetwork from '@/lib/models/local-network';
import LocalAdvertisement from '@/lib/models/local-advertisement';
import Network from '@/lib/models/network';
import Advertiser from '@/lib/models/advertiser';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Users, Calendar, Globe, Image, Trash2 } from 'lucide-react';

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

// Simple card component for displaying local entities
function LocalEntityCard({ entity, networkName, advertiserName }: { 
  entity: LocalEntity; 
  networkName?: string; 
  advertiserName?: string; 
}) {
  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'zone': return <Target className="h-4 w-4" />;
      case 'advertiser': return <Users className="h-4 w-4" />;
      case 'campaign': return <Calendar className="h-4 w-4" />;
      case 'network': return <Globe className="h-4 w-4" />;
      case 'advertisement': return <Image className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getEntityTypeColor = (type: string) => {
    switch (type) {
      case 'zone': return 'bg-blue-100 text-blue-800';
      case 'advertiser': return 'bg-green-100 text-green-800';
      case 'campaign': return 'bg-purple-100 text-purple-800';
      case 'network': return 'bg-indigo-100 text-indigo-800';
      case 'advertisement': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="border-2 border-orange-400 bg-gradient-to-br from-orange-50 to-orange-100 shadow-orange-200 hover:shadow-orange-300 transition-all duration-200 hover:scale-[1.02]">
      <CardHeader className="pb-2">
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0">
            <div className="w-4 h-4">
              {getEntityIcon(entity.type)}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1 mb-1">
              <CardTitle className="card-title text-gray-900 truncate">
                {entity.name}
              </CardTitle>
              <Badge className={`text-xs px-1.5 py-0.5 ${getEntityTypeColor(entity.type)}`}>
                {entity.type}
              </Badge>
            </div>
            {networkName && (
              <p className="card-subtitle text-gray-600">Network: {networkName}</p>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Entity-specific details */}
        <div className="space-y-1.5 card-content">
          {entity.type === 'zone' && (
            <>
              {entity.alias && (
                <div className="flex justify-between">
                  <span className="card-text text-gray-600">Alias:</span>
                  <span className="card-text font-medium">{entity.alias}</span>
                </div>
              )}
              {entity.width && entity.height && (
                <div className="flex justify-between">
                  <span className="card-text text-gray-600">Size:</span>
                  <span className="card-text font-medium">{entity.width}x{entity.height}px</span>
                </div>
              )}
              {entity.self_serve && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">Self Serve</Badge>
              )}
            </>
          )}

          {entity.type === 'advertiser' && (
            <>
              {entity.web_home_url && (
                <div className="flex justify-between">
                  <span className="card-text text-gray-600">Website:</span>
                  <span className="card-text font-medium truncate max-w-32">{entity.web_home_url}</span>
                </div>
              )}
              {entity.admins && entity.admins.length > 0 && (
                <div className="flex justify-between">
                  <span className="card-text text-gray-600">Admins:</span>
                  <span className="card-text font-medium">{entity.admins.length}</span>
                </div>
              )}
            </>
          )}

          {entity.type === 'campaign' && (
            <>
              {entity.start_date && (
                <div className="flex justify-between">
                  <span className="card-text text-gray-600">Start Date:</span>
                  <span className="card-text font-medium">{formatDate(entity.start_date)}</span>
                </div>
              )}
              {entity.end_date && (
                <div className="flex justify-between">
                  <span className="card-text text-gray-600">End Date:</span>
                  <span className="card-text font-medium">{formatDate(entity.end_date)}</span>
                </div>
              )}
              {entity.advertiser_id && (
                <div className="flex justify-between">
                  <span className="card-text text-gray-600">Advertiser:</span>
                  <div className="text-right">
                    <div className="card-text font-medium">{advertiserName || `ID: ${entity.advertiser_id}`}</div>
                    {advertiserName && (
                      <div className="card-meta text-gray-500">ID: {entity.advertiser_id}</div>
                    )}
                  </div>
                </div>
              )}
              {entity.weight !== undefined && (
                <div className="flex justify-between">
                  <span className="card-text text-gray-600">Weight:</span>
                  <span className="card-text font-medium">
                    {entity.weight === 0 ? 'Remnant (0)' :
                     entity.weight === 0.5 ? 'Low (0.5)' :
                     entity.weight === 1 ? 'Default (1)' :
                     entity.weight === 1.5 ? 'High (1.5)' :
                     entity.weight === 127 ? 'Sponsorship (127)' :
                     entity.weight}
                  </span>
                </div>
              )}
            </>
          )}

          {entity.type === 'network' && (
            <>
              {entity.web_home_url && (
                <div className="flex justify-between">
                  <span className="card-text text-gray-600">Website:</span>
                  <span className="card-text font-medium truncate max-w-32">{entity.web_home_url}</span>
                </div>
              )}
              {entity.valet_active && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">Valet Active</Badge>
              )}
            </>
          )}

          {entity.type === 'advertisement' && (
            <>
              {entity.type && (
                <div className="flex justify-between">
                  <span className="card-text text-gray-600">Type:</span>
                  <span className="card-text font-medium">{entity.type}</span>
                </div>
              )}
              {entity.preview_url && (
                <div className="flex justify-between">
                  <span className="card-text text-gray-600">Preview:</span>
                  <span className="card-text font-medium truncate max-w-32">{entity.preview_url}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-2 pt-2 border-t border-orange-200">
          <div className="flex justify-between items-center card-meta text-gray-500">
            <span>Created: {formatDate(entity.created_at)}</span>
            <span>ID: {entity._id.slice(-8)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Section component for each entity type
function EntitySection({ 
  title, 
  entities, 
  networkMap, 
  advertiserMap 
}: { 
  title: string; 
  entities: LocalEntity[]; 
  networkMap: Map<number, string>; 
  advertiserMap: Map<number, string>; 
}) {
  if (entities.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <h2 className="card-title text-gray-900">{title}</h2>
        <Badge variant="outline" className="text-xs px-2 py-1">
          {entities.length} {entities.length === 1 ? 'item' : 'items'}
        </Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {entities.map((entity) => (
          <LocalEntityCard
            key={entity._id}
            entity={entity}
            networkName={networkMap.get(entity.network_id)}
            advertiserName={entity.type === 'campaign' ? advertiserMap.get(entity.advertiser_id) : undefined}
          />
        ))}
      </div>
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
    
    // Also fetch locally created advertisers from the main Advertiser collection
    const mainLocalAdvertisers = await Advertiser.find({ 
      synced_with_api: false,
      created_locally: true 
    }).select('-id').sort({ created_at: -1 }).lean();
    
    // Convert main advertisers to LocalEntity format for display
    const convertedMainAdvertisers = mainLocalAdvertisers.map(advertiser => ({
      _id: advertiser._id.toString(),
      name: advertiser.name,
      network_id: advertiser.network_id,
      web_home_url: advertiser.web_home_url,
      notes: advertiser.notes,
      admins: advertiser.admins,
      created_locally: advertiser.created_locally,
      synced_with_api: advertiser.synced_with_api,
      created_at: advertiser.created_at || new Date(),
      type: 'advertiser' as const,
    })) as LocalEntity[];
    
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
      zones: localZones.map(zone => ({
        ...zone,
        _id: zone._id.toString(),
        created_at: zone.created_at.toISOString(),
        type: 'zone' as const,
      })),
      advertisers: allLocalAdvertisers.map(advertiser => ({
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

    const totalEntities = serializedData.zones.length + serializedData.advertisers.length + 
                         serializedData.campaigns.length + serializedData.networks.length + 
                         serializedData.advertisements.length;

    if (totalEntities === 0) {
      return (
        <div className="text-center py-12">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Local Entities</h3>
            <p className="text-gray-600 mb-4">
              You haven't created any local entities yet. Create zones, advertisers, campaigns, networks, or advertisements to see them here.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="card-title text-gray-900">Local Entities Summary</h2>
              <p className="card-text text-gray-600 mt-1">
                {totalEntities} local entities ready to sync to Broadstreet
              </p>
            </div>
          </div>
        </div>

        {/* Entity Sections */}
        <EntitySection
          title="Zones"
          entities={serializedData.zones}
          networkMap={networkMap}
          advertiserMap={advertiserMap}
        />

        <EntitySection
          title="Advertisers"
          entities={serializedData.advertisers}
          networkMap={networkMap}
          advertiserMap={advertiserMap}
        />

        <EntitySection
          title="Campaigns"
          entities={serializedData.campaigns}
          networkMap={networkMap}
          advertiserMap={advertiserMap}
        />

        <EntitySection
          title="Networks"
          entities={serializedData.networks}
          networkMap={networkMap}
          advertiserMap={advertiserMap}
        />

        <EntitySection
          title="Advertisements"
          entities={serializedData.advertisements}
          networkMap={networkMap}
          advertiserMap={advertiserMap}
        />
      </div>
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
        <LocalOnlyData />
      </Suspense>
    </div>
  );
}