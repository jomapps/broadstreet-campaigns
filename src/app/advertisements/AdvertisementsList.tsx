'use client';

import { useState, useMemo } from 'react';
import { useFilters } from '@/contexts/FilterContext';
import { SearchInput } from '@/components/ui/search-input';

// Type for serialized advertisement data (plain object without Mongoose methods)
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
  createdAt: string;
  updatedAt: string;
};

interface AdvertisementCardProps {
  advertisement: AdvertisementLean;
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

interface AdvertisementsListProps {
  advertisements: AdvertisementLean[];
}

export default function AdvertisementsList({ advertisements }: AdvertisementsListProps) {
  const { selectedNetwork, selectedAdvertiser, selectedCampaign } = useFilters();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAdvertisements = useMemo(() => {
    if (!searchTerm.trim()) {
      return advertisements;
    }
    
    return advertisements.filter(advertisement =>
      advertisement.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      advertisement.advertiser.toLowerCase().includes(searchTerm.toLowerCase()) ||
      advertisement.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [advertisements, searchTerm]);

  // Check if network is selected
  if (!selectedNetwork) {
    return (
      <div className="text-center py-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Network Required</h3>
          <p className="text-yellow-700 mb-4">
            Please select a network from the sidebar filters to view advertisements.
          </p>
          <p className="text-sm text-yellow-600">
            Advertisements are specific to each network, so you need to choose which network&apos;s advertisements you want to see.
          </p>
        </div>
      </div>
    );
  }

  // Check if advertiser is selected
  if (!selectedAdvertiser) {
    return (
      <div className="text-center py-12">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Advertiser Required</h3>
          <p className="text-blue-700 mb-4">
            Please select an advertiser from the sidebar filters to view advertisements.
          </p>
          <p className="text-sm text-blue-600">
            Advertisements belong to specific advertisers, so you need to choose which advertiser&apos;s advertisements you want to see.
          </p>
        </div>
      </div>
    );
  }

  // Check if campaign is selected
  if (!selectedCampaign) {
    return (
      <div className="text-center py-12">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Campaign Required</h3>
          <p className="text-green-700 mb-4">
            Please select a campaign from the sidebar filters to view advertisements.
          </p>
          <p className="text-sm text-green-600">
            Advertisements are part of specific campaigns, so you need to choose which campaign&apos;s advertisements you want to see.
          </p>
        </div>
      </div>
    );
  }

  if (advertisements.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No advertisements found for the selected campaign. Try syncing data first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="max-w-md">
        <SearchInput
          placeholder="Search advertisements..."
          value={searchTerm}
          onChange={setSearchTerm}
        />
      </div>
      
      {filteredAdvertisements.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No advertisements match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAdvertisements.map((advertisement) => (
            <AdvertisementCard key={advertisement.id} advertisement={advertisement} />
          ))}
        </div>
      )}
    </div>
  );
}
