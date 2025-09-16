import { Suspense } from 'react';
import connectDB from '@/lib/mongodb';
import Zone from '@/lib/models/zone';
import LocalZone from '@/lib/models/local-zone';
import Network from '@/lib/models/network';
import CreationButton from '@/components/creation/CreationButton';
import ZoneFiltersWrapper from './ZoneFiltersWrapper';
import { ZoneLean } from '@/lib/types/lean-entities';


function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(9)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
  );
}


async function ZonesData() {
  try {
    await connectDB();
    
    // Fetch zones from both models
    const [apiZonesRaw, localZonesRaw] = await Promise.all([
      Zone.find({}).sort({ name: 1 }).lean(),
      // Show only truly local, not-yet-synced zones
      LocalZone.find({ synced_with_api: false }).sort({ name: 1 }).lean()
    ]);
    const apiZones = apiZonesRaw as unknown as ZoneLean[];
    const localZones = localZonesRaw as unknown as ZoneLean[];
    
    // Combine zones from both sources
    const allZones = [
      ...apiZones.map(zone => ({ ...zone, source: 'api' as const })),
      ...localZones.map(zone => ({ ...zone, source: 'local' as const, broadstreet_id: undefined })) // LocalZone doesn't have broadstreet_id field
    ];
    
    // Get network names
    const networkIds = [...new Set(allZones.map(z => z.network_id))];
    const networks = await Network.find({ broadstreet_id: { $in: networkIds } }).lean();
    const networkMap = new Map(networks.map(n => [n.broadstreet_id, n.name]));

    // Serialize the data to plain objects
    const serializedZones = allZones.map((zone: any) => ({
      _id: (zone as any)._id?.toString?.(),
      __v: zone.__v,
      broadstreet_id: zone.broadstreet_id,
      name: zone.name,
      network_id: zone.network_id,
      alias: zone.alias,
      self_serve: zone.self_serve || false,
      size_type: zone.size_type,
      size_number: zone.size_number,
      category: zone.category,
      block: zone.block,
      is_home: zone.is_home,
      // LocalZone specific fields
      created_locally: zone.created_locally,
      synced_with_api: zone.synced_with_api,
      created_at: (zone as any).created_at?.toISOString?.(),
      synced_at: (zone as any).synced_at?.toISOString?.(),
      original_broadstreet_id: zone.original_broadstreet_id,
      sync_errors: zone.sync_errors,
      // Additional LocalZone fields
      advertisement_count: zone.advertisement_count,
      allow_duplicate_ads: zone.allow_duplicate_ads,
      concurrent_campaigns: zone.concurrent_campaigns,
      advertisement_label: zone.advertisement_label,
      archived: zone.archived,
      display_type: zone.display_type,
      rotation_interval: zone.rotation_interval,
      animation_type: zone.animation_type,
      width: zone.width,
      height: zone.height,
      rss_shuffle: zone.rss_shuffle,
      style: zone.style,
      source: zone.source,
      createdAt: (zone as any).createdAt?.toISOString?.(),
      updatedAt: (zone as any).updatedAt?.toISOString?.(),
    }));

    return <ZoneFiltersWrapper zones={serializedZones} networkMap={networkMap} />;
  } catch (error) {
    console.error('Error loading zones data:', error);
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Error loading zones. Please try again.</p>
      </div>
    );
  }
}

export default function ZonesPage() {
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
        <ZonesData />
      </Suspense>

      <CreationButton />
    </div>
  );
}
