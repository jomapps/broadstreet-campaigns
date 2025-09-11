'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useFilters } from '@/contexts/FilterContext';

export default function PlacementActions() {
  const { selectedNetwork, selectedAdvertiser, selectedCampaign } = useFilters();
  const [isLoading, setIsLoading] = useState(false);

  const handleSyncPlacements = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/sync/placements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        alert(`Successfully synced ${result.count} placements`);
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        alert(`Failed to sync placements: ${result.message}`);
      }
    } catch (error) {
      console.error('Sync placements error:', error);
      alert('Failed to sync placements. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePlacement = () => {
    // Placement creation functionality will be implemented here
    window.location.href = '/dashboard';
  };

  const canSync = !isLoading;
  const canCreate = selectedNetwork && selectedAdvertiser && selectedCampaign;

  return (
    <div className="flex space-x-3">
      <Button
        onClick={handleSyncPlacements}
        disabled={!canSync}
        variant="outline"
        size="sm"
      >
        {isLoading ? 'Syncing...' : 'Sync Placements'}
      </Button>
      
      <Button
        onClick={handleCreatePlacement}
        disabled={!canCreate}
        size="sm"
      >
        Create Placement
      </Button>
    </div>
  );
}
