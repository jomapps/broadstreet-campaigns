'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdvertiserCreationForm from './forms/AdvertiserCreationForm';
import CampaignCreationForm from './forms/CampaignCreationForm';
import AdvertisementCreationForm from './forms/AdvertisementCreationForm';
import ZoneCreationForm from './forms/ZoneCreationForm';
import NetworkCreationForm from './forms/NetworkCreationForm';

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
        return <AdvertisementCreationForm onClose={onClose} setIsLoading={setIsLoading} />;
      case 'zone':
        return <ZoneCreationForm onClose={onClose} setIsLoading={setIsLoading} />;
      case 'network':
        return <NetworkCreationForm onClose={onClose} setIsLoading={setIsLoading} />;
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
