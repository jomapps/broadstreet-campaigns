'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdvertiserCreationForm from './forms/AdvertiserCreationForm';
import CampaignCreationForm from './forms/CampaignCreationForm';
import AdvertisementCreationForm from './forms/AdvertisementCreationForm';
import ZoneCreationForm from './forms/ZoneCreationForm';

interface CreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'advertiser' | 'campaign' | 'advertisement' | 'zone' | 'network';
}

export default function CreationModal({ isOpen, onClose, entityType }: CreationModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getTitle = () => {
    switch (entityType) {
      case 'advertiser':
        return 'Create New Advertiser';
      case 'campaign':
        return 'Create New Campaign';
      case 'advertisement':
        return 'Create New Advertisement';
      case 'zone':
        return 'Create New Zone';
      case 'network':
        return 'Create New Network';
      default:
        return 'Create New Item';
    }
  };

  const renderForm = () => {
    switch (entityType) {
      case 'advertiser':
        return <AdvertiserCreationForm onClose={onClose} setIsLoading={setIsLoading} />;
      case 'campaign':
        return <CampaignCreationForm onClose={onClose} setIsLoading={setIsLoading} />;
      case 'advertisement':
        return (
          <div className="text-center py-8">
            <div className="mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">We do not create advertisements</h3>
              <p className="text-gray-600 mb-4">
                Advertisement creation is complex and requires features not available through the API.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Please use this link to create advertisements:</strong><br />
                  <a
                    href="https://my.broadstreetads.com/networks/9396/advertisers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    https://my.broadstreetads.com/networks/9396/advertisers
                  </a><br />
                  <strong>Remember to resync if you add something in backend.</strong>
                </p>
              </div>
            </div>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        );
      case 'zone':
        return <ZoneCreationForm onClose={onClose} setIsLoading={setIsLoading} />;
      case 'network':
        return (
          <div className="text-center py-8">
            <div className="mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">We do not create networks</h3>
              <p className="text-gray-600 mb-4">
                Network creation requires commercial contracts and special business processes.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Please use this link to create networks:</strong><br />
                  <a
                    href="https://my.broadstreetads.com/networks"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    https://my.broadstreetads.com/networks
                  </a><br />
                  <strong>Remember to resync if you add something in backend.</strong>
                </p>
              </div>
            </div>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        );
      default:
        return <div>Unknown entity type</div>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <Card className="relative w-full max-w-2xl mx-4 flex flex-col" style={{ maxHeight: '90vh' }}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 flex-shrink-0">
          <CardTitle className="text-xl font-semibold">{getTitle()}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden flex flex-col">
          {renderForm()}
        </CardContent>
      </Card>
    </div>
  );
}
