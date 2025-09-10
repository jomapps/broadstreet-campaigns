'use client';

import { Suspense, useEffect, useState } from 'react';
import { useFilters } from '@/contexts/FilterContext';
import CampaignActions from '@/components/campaigns/CampaignActions';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

// Type for lean query result (plain object without Mongoose methods)
type CampaignLean = {
  _id: string;
  __v: number;
  id: number;
  name: string;
  advertiser_id: number;
  start_date: string;
  end_date?: string;
  active: boolean;
  weight: number;
  max_impression_count?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

interface CampaignCardProps {
  campaign: CampaignLean;
  advertiserName?: string;
  isSelected: boolean;
  onSelect: (campaign: CampaignLean) => void;
}

function CampaignCard({ campaign, advertiserName, isSelected, onSelect }: CampaignCardProps) {
  const startDate = new Date(campaign.start_date);
  const endDate = campaign.end_date ? new Date(campaign.end_date) : null;
  const now = new Date();
  
  const isActive = campaign.active && startDate <= now && (!endDate || endDate >= now);
  
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
              onCheckedChange={() => onSelect(campaign)}
              className="mt-1"
            />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
              {advertiserName && (
                <p className="text-sm text-gray-600 mt-1">Advertiser: {advertiserName}</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end space-y-2">
          {isSelected && (
            <Badge variant="default" className="text-xs">
              Selected
            </Badge>
          )}
          <span className={`px-2 py-1 text-xs rounded-full ${
            isActive 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {isActive ? 'Active' : 'Inactive'}
          </span>
          <span className="text-xs text-gray-500">ID: {campaign.id}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Start Date</p>
          <p className="text-sm font-medium text-gray-900">
            {startDate.toLocaleDateString()}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">End Date</p>
          <p className="text-sm font-medium text-gray-900">
            {endDate ? endDate.toLocaleDateString() : 'No end date'}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-600">Weight</p>
          <p className="text-sm font-medium text-gray-900">{campaign.weight}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Max Impressions</p>
          <p className="text-sm font-medium text-gray-900">
            {campaign.max_impression_count?.toLocaleString() || 'Unlimited'}
          </p>
        </div>
      </div>
      
      {campaign.notes && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">Notes</p>
          <p className="text-sm text-gray-900 mt-1">{campaign.notes}</p>
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
          </div>
        </div>
      ))}
    </div>
  );
}

function CampaignsList() {
  const { selectedAdvertiser, selectedCampaign, setSelectedCampaign, campaigns, isLoadingCampaigns } = useFilters();

  if (isLoadingCampaigns) {
    return <LoadingSkeleton />;
  }

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">
          {!selectedAdvertiser ? 'Select an advertiser to view campaigns' : 'No campaigns found. Try syncing data first.'}
        </p>
      </div>
    );
  }

  const handleCampaignSelect = (campaign: CampaignLean) => {
    if (selectedCampaign?.id === campaign.id) {
      setSelectedCampaign(null);
    } else {
      setSelectedCampaign(campaign);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {campaigns.map((campaign) => (
        <CampaignCard 
          key={campaign.id} 
          campaign={campaign}
          advertiserName={selectedAdvertiser?.name}
          isSelected={selectedCampaign?.id === campaign.id}
          onSelect={handleCampaignSelect}
        />
      ))}
    </div>
  );
}

export default function CampaignsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-600 mt-1">
            Active advertising campaigns and their details
          </p>
        </div>
        
        <Suspense fallback={<div className="flex space-x-3"><div className="bg-gray-200 animate-pulse h-10 w-32 rounded-lg"></div><div className="bg-gray-200 animate-pulse h-10 w-32 rounded-lg"></div></div>}>
          <CampaignActions />
        </Suspense>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <CampaignsList />
      </Suspense>
    </div>
  );
}
