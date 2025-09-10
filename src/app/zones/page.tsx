import { Suspense } from 'react';
import connectDB from '@/lib/mongodb';
import Zone from '@/lib/models/zone';
import Network from '@/lib/models/network';
import { getSizeInfo } from '@/lib/utils/zone-parser';
import ZoneActions from '@/components/zones/ZoneActions';

interface ZoneCardProps {
  zone: {
    id: number;
    name: string;
    network_id: number;
    alias?: string | null;
    self_serve: boolean;
    size_type?: 'SQ' | 'PT' | 'LS' | null;
    size_number?: number | null;
    category?: string | null;
    block?: string | null;
    is_home?: boolean;
  };
  networkName?: string;
}

function ZoneCard({ zone, networkName }: ZoneCardProps) {
  const sizeInfo = zone.size_type ? getSizeInfo(zone.size_type) : null;
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{zone.name}</h3>
          {networkName && (
            <p className="text-sm text-gray-600 mt-1">Network: {networkName}</p>
          )}
          {zone.alias && (
            <p className="text-sm text-gray-500 mt-1">Alias: {zone.alias}</p>
          )}
        </div>
        
        <div className="flex flex-col items-end space-y-2">
          {zone.size_type && (
            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
              {zone.size_type}
              {zone.size_number && zone.size_number}
            </span>
          )}
          <span className="text-xs text-gray-500">ID: {zone.id}</span>
        </div>
      </div>
      
      {sizeInfo && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-900">{sizeInfo.description}</p>
          <p className="text-sm text-gray-600">Dimensions: {sizeInfo.dimensions}px</p>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        {zone.category && (
          <div>
            <p className="text-sm text-gray-600">Category</p>
            <p className="text-sm font-medium text-gray-900">{zone.category}</p>
          </div>
        )}
        {zone.block && (
          <div>
            <p className="text-sm text-gray-600">Block</p>
            <p className="text-sm font-medium text-gray-900">{zone.block}</p>
          </div>
        )}
      </div>
      
      <div className="mt-4 flex items-center space-x-4">
        {zone.is_home && (
          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
            Home Page
          </span>
        )}
        {zone.self_serve && (
          <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
            Self Serve
          </span>
        )}
      </div>
    </div>
  );
}

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

async function ZonesList() {
  await connectDB();
  
  const zones = await Zone.find({}).sort({ name: 1 }).lean();
  
  // Get network names
  const networkIds = [...new Set(zones.map(z => z.network_id))];
  const networks = await Network.find({ id: { $in: networkIds } }).lean();
  const networkMap = new Map(networks.map(n => [n.id, n.name]));

  if (zones.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No zones found. Try syncing data first.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {zones.map((zone) => (
        <ZoneCard 
          key={zone.id} 
          zone={zone} 
          networkName={networkMap.get(zone.network_id)}
        />
      ))}
    </div>
  );
}

export default function ZonesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Zones</h1>
          <p className="text-gray-600 mt-1">
            Possible ad placements across your networks
          </p>
        </div>
        
        <Suspense fallback={<div className="bg-gray-200 animate-pulse h-10 w-32 rounded-lg"></div>}>
          <ZoneActions />
        </Suspense>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Zone Size Guide</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">SQ</span>
            <span>Square ads (300x250px)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">PT</span>
            <span>Portrait banners (300x600px)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">LS</span>
            <span>Horizontal banners (728x90px)</span>
          </div>
        </div>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <ZonesList />
      </Suspense>
    </div>
  );
}
