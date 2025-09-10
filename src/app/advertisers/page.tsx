import { Suspense } from 'react';
import connectDB from '@/lib/mongodb';
import Advertiser from '@/lib/models/advertiser';
import AdvertiserActions from '@/components/advertisers/AdvertiserActions';

interface AdvertiserCardProps {
  advertiser: {
    id: number;
    name: string;
    logo?: { url: string };
    web_home_url?: string;
    notes?: string | null;
    admins?: Array<{ name: string; email: string }>;
  };
}

function AdvertiserCard({ advertiser }: AdvertiserCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            {advertiser.logo?.url && (
              <img
                src={advertiser.logo.url}
                alt={`${advertiser.name} logo`}
                className="w-8 h-8 rounded object-cover"
              />
            )}
            <h3 className="text-lg font-semibold text-gray-900">{advertiser.name}</h3>
          </div>
          
          {advertiser.web_home_url && (
            <a
              href={advertiser.web_home_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block"
            >
              {advertiser.web_home_url}
            </a>
          )}
        </div>
        
        <span className="text-xs text-gray-500">ID: {advertiser.id}</span>
      </div>
      
      {advertiser.notes && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Notes</p>
          <p className="text-sm text-gray-900 mt-1">{advertiser.notes}</p>
        </div>
      )}
      
      {advertiser.admins && advertiser.admins.length > 0 && (
        <div>
          <p className="text-sm text-gray-600 mb-2">Admins</p>
          <div className="space-y-1">
            {advertiser.admins.map((admin, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-gray-900">{admin.name}</span>
                <a
                  href={`mailto:${admin.email}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {admin.email}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
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
            <div className="h-16 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

async function AdvertisersList() {
  await connectDB();
  const advertisers = await Advertiser.find({}).sort({ name: 1 }).lean();

  if (advertisers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No advertisers found. Try syncing data first.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {advertisers.map((advertiser) => (
        <AdvertiserCard key={advertiser.id} advertiser={advertiser} />
      ))}
    </div>
  );
}

export default function AdvertisersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advertisers</h1>
          <p className="text-gray-600 mt-1">
            Companies running advertising campaigns
          </p>
        </div>
        
        <Suspense fallback={<div className="bg-gray-200 animate-pulse h-10 w-32 rounded-lg"></div>}>
          <AdvertiserActions />
        </Suspense>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <AdvertisersList />
      </Suspense>
    </div>
  );
}
