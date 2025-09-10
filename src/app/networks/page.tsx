import { Suspense } from 'react';
import connectDB from '@/lib/mongodb';
import Network from '@/lib/models/network';
import NetworkActions from '@/components/networks/NetworkActions';

interface NetworkCardProps {
  network: {
    id: number;
    name: string;
    web_home_url?: string;
    logo?: { url: string };
    valet_active: boolean;
    advertiser_count?: number;
    zone_count?: number;
  };
}

function NetworkCard({ network }: NetworkCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            {network.logo?.url && (
              <img
                src={network.logo.url}
                alt={`${network.name} logo`}
                className="w-8 h-8 rounded object-cover"
              />
            )}
            <h3 className="text-lg font-semibold text-gray-900">{network.name}</h3>
          </div>
          
          {network.web_home_url && (
            <a
              href={network.web_home_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block"
            >
              {network.web_home_url}
            </a>
          )}
          
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Advertisers</p>
              <p className="text-lg font-semibold text-gray-900">
                {network.advertiser_count || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Zones</p>
              <p className="text-lg font-semibold text-gray-900">
                {network.zone_count || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end space-y-2">
          <span className={`px-2 py-1 text-xs rounded-full ${
            network.valet_active 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {network.valet_active ? 'Valet Active' : 'Standard'}
          </span>
          <span className="text-xs text-gray-500">ID: {network.id}</span>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="h-3 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
              <div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

async function NetworksList() {
  await connectDB();
  const networks = await Network.find({}).sort({ name: 1 }).lean();

  if (networks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No networks found. Try syncing data first.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {networks.map((network) => (
        <NetworkCard key={network.id} network={network} />
      ))}
    </div>
  );
}

export default function NetworksPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Networks</h1>
          <p className="text-gray-600 mt-1">
            Different websites where campaigns are run
          </p>
        </div>
        
        <Suspense fallback={<div className="bg-gray-200 animate-pulse h-10 w-32 rounded-lg"></div>}>
          <NetworkActions />
        </Suspense>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <NetworksList />
      </Suspense>
    </div>
  );
}
