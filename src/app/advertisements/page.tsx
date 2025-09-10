import { Suspense } from 'react';
import connectDB from '@/lib/mongodb';
import Advertisement from '@/lib/models/advertisement';
import AdvertisementActions from '@/components/advertisements/AdvertisementActions';

interface AdvertisementCardProps {
  advertisement: {
    id: number;
    name: string;
    updated_at: string;
    type: string;
    advertiser: string;
    active: { url?: string | null };
    active_placement: boolean;
    preview_url: string;
  };
}

function AdvertisementCard({ advertisement }: AdvertisementCardProps) {
  const updatedDate = new Date(advertisement.updated_at);
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{advertisement.name}</h3>
          <p className="text-sm text-gray-600 mt-1">Advertiser: {advertisement.advertiser}</p>
        </div>
        
        <div className="flex flex-col items-end space-y-2">
          <span className={`px-2 py-1 text-xs rounded-full ${
            advertisement.active_placement 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {advertisement.active_placement ? 'Active' : 'Inactive'}
          </span>
          <span className="text-xs text-gray-500">ID: {advertisement.id}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Type</p>
          <p className="text-sm font-medium text-gray-900">{advertisement.type}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Last Updated</p>
          <p className="text-sm font-medium text-gray-900">
            {updatedDate.toLocaleDateString()}
          </p>
        </div>
      </div>
      
      {advertisement.active.url && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Active Image</p>
          <img
            src={advertisement.active.url}
            alt={advertisement.name}
            className="w-full h-32 object-cover rounded border"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}
      
      <div className="flex space-x-2">
        <a
          href={advertisement.preview_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-3 rounded text-sm font-medium transition-colors duration-200"
        >
          Preview
        </a>
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
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="w-16 h-6 bg-gray-200 rounded"></div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
              <div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
            <div className="h-32 bg-gray-200 rounded mb-4"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

async function AdvertisementsList() {
  await connectDB();
  const advertisements = await Advertisement.find({}).sort({ updated_at: -1 }).lean();

  if (advertisements.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No advertisements found. Try syncing data first.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {advertisements.map((advertisement) => (
        <AdvertisementCard key={advertisement.id} advertisement={advertisement} />
      ))}
    </div>
  );
}

export default function AdvertisementsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advertisements</h1>
          <p className="text-gray-600 mt-1">
            Actual ads shown on your websites
          </p>
        </div>
        
        <Suspense fallback={<div className="bg-gray-200 animate-pulse h-10 w-32 rounded-lg"></div>}>
          <AdvertisementActions />
        </Suspense>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Advertisement Types</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
            <span>Image</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            <span>Text</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
            <span>Video</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
            <span>Native</span>
          </div>
        </div>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <AdvertisementsList />
      </Suspense>
    </div>
  );
}
