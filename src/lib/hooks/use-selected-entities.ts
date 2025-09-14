'use client';

import { useMemo } from 'react';
import { useFilters } from '@/contexts/FilterContext';
import type { Network } from '@/lib/types/broadstreet';

type EntityType = 'network' | 'advertiser' | 'campaign' | 'zone' | 'advertisement';

interface BaseSelectedEntity<T extends EntityType, IDType> {
  id: IDType;
  name: string;
  type: T;
}

export interface SelectedEntitiesResult {
  network: BaseSelectedEntity<'network', number> | null;
  advertiser: BaseSelectedEntity<'advertiser', number> | null;
  campaign: BaseSelectedEntity<'campaign', number | string> | null;
  zones: Array<BaseSelectedEntity<'zone', string>>;
  advertisements: Array<BaseSelectedEntity<'advertisement', string>>;
}

/**
 * useSelectedEntities
 *
 * Centralized accessor for selected entities from FilterContext. Normalizes
 * selections into a consistent shape and keeps render-phase pure by avoiding
 * state updates during render.
 */
export function useSelectedEntities(): SelectedEntitiesResult {
  const {
    selectedNetwork,
    selectedAdvertiser,
    selectedCampaign,
    selectedZones,
    selectedAdvertisements,
    networks,
  } = useFilters();


  const network = useMemo(() => {
    return selectedNetwork && typeof selectedNetwork.id === 'number'
      ? ({
          id: selectedNetwork.id,
          name: selectedNetwork.name || String(selectedNetwork.id),
          type: 'network' as const,
        })
      : null;
  }, [selectedNetwork]);

  const advertiser = useMemo(() => {
    return selectedAdvertiser && typeof selectedAdvertiser.id === 'number'
      ? ({
          id: selectedAdvertiser.id,
          name: selectedAdvertiser.name || String(selectedAdvertiser.id),
          type: 'advertiser' as const,
        })
      : null;
  }, [selectedAdvertiser]);

  const campaign = useMemo(() => {
    if (!selectedCampaign) return null;
    const id = (selectedCampaign as any).id as number | string;
    return {
      id,
      name: selectedCampaign.name || String(id),
      type: 'campaign' as const,
    };
  }, [selectedCampaign]);

  const zones = useMemo(() => {
    if (!Array.isArray(selectedZones)) return [];
    // Support legacy formats: [stringId] or [{id: string|number}]
    return selectedZones.map((zone) => {
      const id = typeof zone === 'string' ? zone : (zone && (zone as any).id != null ? String((zone as any).id) : '');
      const safeId = id || '';
      return { id: safeId, name: safeId, type: 'zone' as const };
    }).filter(z => z.id !== '');
  }, [selectedZones]);

  const advertisements = useMemo(() => {
    if (!Array.isArray(selectedAdvertisements)) return [];
    // Support legacy formats: [stringId] or [{id: string|number}]
    return selectedAdvertisements.map((ad) => {
      const id = typeof ad === 'string' ? ad : (ad && (ad as any).id != null ? String((ad as any).id) : '');
      const safeId = id || '';
      return { id: safeId, name: safeId, type: 'advertisement' as const };
    }).filter(a => a.id !== '');
  }, [selectedAdvertisements]);

  return { network, advertiser, campaign, zones, advertisements };
}

// Optional alias export for backward-compatibility and migration ease
export const selectedEntities = useSelectedEntities;


