import { Suspense } from 'react';
import connectDB from '@/lib/mongodb';
import Zone from '@/lib/models/zone';
import Network from '@/lib/models/network';
import ZoneActions from '@/components/zones/ZoneActions';
import ZonesList from './ZonesList';

// Type for lean query result (plain object without Mongoose methods)
type ZoneLean = {
  _id: string;
  __v: number;
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
  createdAt: Date;
  updatedAt: Date;
};


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
  await connectDB();
  
  const zones = await Zone.find({}).sort({ name: 1 }).lean() as ZoneLean[];
  
  // Get network names
  const networkIds = [...new Set(zones.map(z => z.network_id))];
  const networks = await Network.find({ id: { $in: networkIds } }).lean();
  const networkMap = new Map(networks.map(n => [n.id, n.name]));

  // Serialize the data to plain objects
  const serializedZones = zones.map(zone => ({
    _id: zone._id.toString(),
    __v: zone.__v,
    id: zone.id,
    name: zone.name,
    network_id: zone.network_id,
    alias: zone.alias,
    self_serve: zone.self_serve,
    size_type: zone.size_type,
    size_number: zone.size_number,
    category: zone.category,
    block: zone.block,
    is_home: zone.is_home,
    createdAt: zone.createdAt.toISOString(),
    updatedAt: zone.updatedAt.toISOString(),
  }));

  return <ZonesList zones={serializedZones} networkMap={networkMap} />;
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
        <ZonesData />
      </Suspense>
    </div>
  );
}
