'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useSelectedEntities } from '@/lib/hooks/use-selected-entities';
import { usePlacementCreation } from '@/hooks/usePlacementCreation';

interface CreatePlacementsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreatePlacementsModal({ isOpen, onClose }: CreatePlacementsModalProps) {
  const entities = useSelectedEntities();
  const {
    adCount,
    zoneCount,
    combinationsCount,
    isSubmitting,
    error,
    successMessage,
    createPlacements,
    clearMessages,
  } = usePlacementCreation();

  if (!isOpen) return null;

  const handleSubmit = async () => {
    await createPlacements();
  };

  const handleClose = () => {
    clearMessages();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} aria-hidden="true" />
      <Card className="relative w-full max-w-2xl mx-4 flex flex-col" style={{ maxHeight: '90vh' }} data-testid="create-placements-modal">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 flex-shrink-0">
          <CardTitle className="text-xl font-semibold">Create Placements</CardTitle>
          <Button variant="ghost" size="sm" onClick={handleClose} className="h-8 w-8 p-0" data-testid="close-modal-button">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto space-y-4">
          <div className="space-y-1">
            <p className="text-sm text-gray-700">Campaign</p>
            <p className="font-medium">{entities.campaign?.name ?? 'N/A'}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-700">Selected Advertisements</p>
              <p className="font-medium">{entities.advertisements.length}</p>
              {entities.advertisements.length > 0 && (
                <ul className="list-disc pl-5 text-sm text-gray-700">
                  {entities.advertisements.slice(0, 5).map((ad) => {
                    const idNum = typeof ad.ids.broadstreet_id === 'number' ? ad.ids.broadstreet_id : undefined;
                    const label = typeof idNum === 'number' ? idNum : ad.id; // fallback to legacy id (mongo string)
                    const key = typeof idNum === 'number' ? String(idNum) : String(ad.id);
                    return (
                      <li key={key}>Ad {String(label)}</li>
                    );
                  })}
                  {entities.advertisements.length > 5 && (
                    <li>+{entities.advertisements.length - 5} more</li>
                  )}
                </ul>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-700">Selected Zones</p>
              <p className="font-medium">{entities.zones.length}</p>
              {entities.zones.length > 0 && (
                <ul className="list-disc pl-5 text-sm text-gray-700">
                  {entities.zones.slice(0, 5).map((zone) => (
                    <li key={zone.id}>Zone {zone.id}</li>
                  ))}
                  {entities.zones.length > 5 && (
                    <li>+{entities.zones.length - 5} more</li>
                  )}
                </ul>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3" data-testid="placement-summary">
            <p className="text-sm text-blue-800">
              {adCount} advertisements × {zoneCount} zones = <strong>{combinationsCount}</strong> placements
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting} data-testid="cancel-button">Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || !entities.campaign || combinationsCount === 0} data-testid="create-placements-button">
              {isSubmitting ? 'Creating...' : 'Create Placements'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


