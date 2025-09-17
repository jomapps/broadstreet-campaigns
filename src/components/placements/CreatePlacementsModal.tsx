'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useSelectedEntities } from '@/lib/hooks/use-selected-entities';
import { useLocalPlacementCreation } from '@/hooks/useLocalPlacementCreation';

interface CreatePlacementsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreatePlacementsModal({ isOpen, onClose }: CreatePlacementsModalProps) {
  const entities = useSelectedEntities();
  const {
    networkId,
    advertiserId,
    adIds,
    adCount,
    zoneCount,
    combinationsCount,
    isSubmitting,
    error,
    successMessage,
    createLocalPlacements,
    clearMessages,
  } = useLocalPlacementCreation();

  if (!isOpen) return null;

  const handleSubmit = async () => {
    await createLocalPlacements();
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-700">Network</p>
              <p className="font-medium">{entities.network?.name ?? 'N/A'}</p>
              {!entities.network && (
                <p className="text-xs text-red-600">Required for local placements</p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-700">Advertiser</p>
              <p className="font-medium">{entities.advertiser?.name ?? 'N/A'}</p>
              {!entities.advertiser && (
                <p className="text-xs text-red-600">Required for local placements</p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-700">Campaign</p>
              <p className="font-medium">{entities.campaign?.name ?? 'N/A'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-700">Selected Advertisements</p>
              <p className="font-medium">{entities.advertisements.length}</p>
              {adIds.length > 0 && (
                <ul className="list-disc pl-5 text-sm text-gray-700">
                  {adIds.slice(0, 5).map((adId) => (
                    <li key={String(adId)}>Ad {String(adId)}</li>
                  ))}
                  {adIds.length > 5 && (
                    <li>+{adIds.length - 5} more</li>
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
                    <li key={String(zone.broadstreet_id)}>Zone {String(zone.broadstreet_id)}</li>
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
              {adCount} advertisements × {entities.zones.length} zones = <strong>{combinationsCount}</strong> local placements
            </p>
            <p className="text-xs text-blue-600 mt-1">
              These will be stored in the local placement collection and can be synced to Broadstreet later.
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
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !entities.campaign || !entities.network || !entities.advertiser || combinationsCount === 0}
              data-testid="create-placements-button"
            >
              {isSubmitting ? 'Creating...' : 'Create Local Placements'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


