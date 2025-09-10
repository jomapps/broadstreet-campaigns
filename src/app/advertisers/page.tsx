'use client';

import { Suspense, useEffect, useState } from 'react';
import { useFilters } from '@/contexts/FilterContext';
import AdvertiserActions from '@/components/advertisers/AdvertiserActions';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

// Type for lean query result (plain object without Mongoose methods)
type AdvertiserLean = {
  _id: string;
  __v: number;
  id: number;
  name: string;
  logo?: { url: string };
  web_home_url?: string;
  notes?: string | null;
  admins?: Array<{ name: string; email: string }>;
  createdAt: Date;
  updatedAt: Date;
};

interface AdvertiserCardProps {
  advertiser: AdvertiserLean;
  isSelected: boolean;
  onSelect: (advertiser: AdvertiserLean) => void;
}

function AdvertiserCard({ advertiser, isSelected, onSelect }: AdvertiserCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 transition-all duration-200 ${
      isSelected 
        ? 'border-primary shadow-md shadow-primary/10' 
        : 'border-gray-200 hover:border-gray-300'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onSelect(advertiser)}
              className="mt-1"
            />
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
        
        <div className="flex flex-col items-end space-y-1">
          {isSelected && (
            <Badge variant="default" className="text-xs">
              Selected
            </Badge>
          )}
          <span className="text-xs text-gray-500">ID: {advertiser.id}</span>
        </div>
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

function AdvertisersList() {
  const { selectedNetwork, selectedAdvertiser, setSelectedAdvertiser, advertisers, isLoadingAdvertisers } = useFilters();

  if (isLoadingAdvertisers) {
    return <LoadingSkeleton />;
  }

  if (advertisers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">
          {!selectedNetwork ? 'Select a network to view advertisers' : 'No advertisers found. Try syncing data first.'}
        </p>
      </div>
    );
  }

  const handleAdvertiserSelect = (advertiser: AdvertiserLean) => {
    if (selectedAdvertiser?.id === advertiser.id) {
      setSelectedAdvertiser(null);
    } else {
      setSelectedAdvertiser(advertiser);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {advertisers.map((advertiser) => (
        <AdvertiserCard 
          key={advertiser.id} 
          advertiser={advertiser}
          isSelected={selectedAdvertiser?.id === advertiser.id}
          onSelect={handleAdvertiserSelect}
        />
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
