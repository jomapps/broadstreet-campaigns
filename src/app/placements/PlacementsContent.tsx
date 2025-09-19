/**
 * PLACEMENTS CONTENT - MAIN PLACEMENTS UI
 * 
 * Main placements content component that displays placements grid and handles interactions.
 * Reads data from Zustand stores and provides placement management functionality.
 * All variable names follow docs/variable-origins.md registry.
 */

'use client';

import { useState } from 'react';
import { useEntityStore } from '@/stores';
import { useSelectedEntities } from '@/lib/hooks/use-selected-entities';
import { Button } from '@/components/ui/button';
import CreatePlacementsModal from '@/components/placements/CreatePlacementsModal';
import PlacementsList from './PlacementsList';
import LoadingSkeleton from './LoadingSkeleton';

/**
 * PlacementsActions - Placement action buttons component
 * Variable names follow docs/variable-origins.md registry
 */
function PlacementsActions() {
  const entities = useSelectedEntities();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const canCreatePlacements = Boolean(
    entities.network &&
    entities.campaign &&
    entities.advertisements.length > 0 &&
    entities.zones.length > 0
  );

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          onClick={() => setIsModalOpen(true)}
          disabled={!canCreatePlacements}
          aria-disabled={!canCreatePlacements}
        >
          Create Placements
        </Button>
      </div>

      <CreatePlacementsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

/**
 * PlacementsData - Main placements data display component
 * Variable names follow docs/variable-origins.md registry
 */
function PlacementsData() {
  // Get data from Zustand stores using exact names from docs/variable-origins.md registry
  const { placements, isLoading } = useEntityStore();
  const entities = useSelectedEntities();

  if (isLoading.placements) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <LoadingSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Check if network is selected
  if (!entities.network) {
    return (
      <div className="text-center py-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="card-title text-yellow-800 mb-2">Network Required</h3>
          <p className="card-text text-yellow-700 mb-4">
            Please select a network from the sidebar filters to view placements.
          </p>
          <p className="card-text text-yellow-600">
            Placements are specific to each network, so you need to choose which network's placements you want to see.
          </p>
        </div>
      </div>
    );
  }

  return <PlacementsList placements={placements} entities={entities} />;
}

/**
 * PlacementsContent - Main placements content component
 * Variable names follow docs/variable-origins.md registry
 */
export default function PlacementsContent() {
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <PlacementsActions />
      </div>

      <div data-testid="placements-data">
        <PlacementsData />
      </div>
    </div>
  );
}
