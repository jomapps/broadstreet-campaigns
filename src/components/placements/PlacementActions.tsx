'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSelectedEntities } from '@/lib/hooks/use-selected-entities';
import CreatePlacementsModal from '@/components/placements/CreatePlacementsModal';

export default function PlacementActions() {
  const entities = useSelectedEntities();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleOpenCreate = () => {
    setIsCreateOpen(true);
  };

  const canCreate = !!entities.campaign && entities.zones.length > 0 && entities.advertisements.length > 0;

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
