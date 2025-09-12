'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useFilters } from '@/contexts/FilterContext';
import CreatePlacementsModal from '@/components/placements/CreatePlacementsModal';

export default function PlacementActions() {
  const { selectedCampaign, selectedZones, selectedAdvertisements } = useFilters();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleOpenCreate = () => {
    setIsCreateOpen(true);
  };

  const canCreate = !!selectedCampaign && selectedZones.length > 0 && selectedAdvertisements.length > 0;

  return (
    <div className="flex space-x-3">
      <Button
        onClick={handleOpenCreate}
        disabled={!canCreate}
        size="sm"
      >
        Create Placements
      </Button>

      <CreatePlacementsModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}
