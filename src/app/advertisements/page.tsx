import { Suspense } from 'react';
import connectDB from '@/lib/mongodb';
import Advertisement from '@/lib/models/advertisement';
import CreationButton from '@/components/creation/CreationButton';
import AdvertisementFiltersWrapper from './AdvertisementFiltersWrapper';

// Type for lean query result (plain object without Mongoose methods)
type AdvertisementLean = {
  _id: string;
  __v: number;
  id: number;
  name: string;
  updated_at: string;
  type: string;
  advertiser: string;
  active: {
    url?: string | null;
  };
  active_placement: boolean;
  preview_url: string;
  createdAt: Date;
  updatedAt: Date;
};


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


async function AdvertisementsData() {
  await connectDB();
  const advertisements = await Advertisement.find({}).sort({ name: 1 }).lean() as AdvertisementLean[];
  
  // Serialize the data to plain objects
  const serializedAdvertisements = advertisements.map(advertisement => ({
    _id: advertisement._id.toString(),
    __v: advertisement.__v,
    id: advertisement.id,
    name: advertisement.name,
    updated_at: advertisement.updated_at,
    type: advertisement.type,
    advertiser: advertisement.advertiser,
    active: advertisement.active,
    active_placement: advertisement.active_placement,
    preview_url: advertisement.preview_url,
    createdAt: advertisement.createdAt.toISOString(),
    updatedAt: advertisement.updatedAt.toISOString(),
  }));
  
  return <AdvertisementFiltersWrapper advertisements={serializedAdvertisements} />;
}

export default function AdvertisementsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Advertisements</h1>
          <p className="card-text text-gray-600 mt-1">
            Actual ads shown on your websites
          </p>
        </div>
        
        <Suspense fallback={<div className="bg-gray-200 animate-pulse h-10 w-32 rounded-lg"></div>}>
          <CreationButton />
        </Suspense>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h2 className="card-title text-gray-900 mb-2">Advertisement Types</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 card-text">
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
        <AdvertisementsData />
      </Suspense>

      <CreationButton />
    </div>
  );
}
