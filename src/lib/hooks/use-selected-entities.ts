'use client';

import { useMemo } from 'react';
import { useFilters } from '@/contexts/FilterContext';

type EntityType = 'network' | 'advertiser' | 'campaign' | 'zone' | 'advertisement';

export type EntityIds = { broadstreet_id?: number; mongo_id?: string };

export type BaseSelectedEntity<T extends EntityType> = {
  ids: EntityIds;
  // Legacy convenience id for existing consumers (number when broadstreet_id present, else string mongo_id)
  id: number | string;
  name: string;
  type: T;
};

export interface SelectedEntitiesResult {
  network: BaseSelectedEntity<'network'> | null;
  advertiser: BaseSelectedEntity<'advertiser'> | null;
  campaign: BaseSelectedEntity<'campaign'> | null;
  zones: Array<BaseSelectedEntity<'zone'>>;
  advertisements: Array<BaseSelectedEntity<'advertisement'>>;
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
    if (!selectedNetwork) return null;
    const bsId = (selectedNetwork as any).broadstreet_network_id ?? (selectedNetwork as any).broadstreet_id ?? (selectedNetwork as any).id;
    const mongoId = (selectedNetwork as any).local_network_id ?? (selectedNetwork as any).mongo_id;
    const ids: EntityIds = {};
    if (typeof bsId === 'number') ids.broadstreet_id = bsId;
    if (typeof mongoId === 'string') ids.mongo_id = mongoId;
    if (!ids.broadstreet_id && !ids.mongo_id) return null;
    return {
      ids,
      id: typeof bsId === 'number' ? bsId : (mongoId as string),
      name: (selectedNetwork as any).name || String(bsId ?? mongoId),
      type: 'network' as const,
    };
  }, [selectedNetwork]);

  const advertiser = useMemo(() => {
    if (!selectedAdvertiser) return null;
    const bsId = (selectedAdvertiser as any).broadstreet_advertiser_id ?? (selectedAdvertiser as any).broadstreet_id ?? (selectedAdvertiser as any).id;
    const mongoId = (selectedAdvertiser as any).local_advertiser_id ?? (selectedAdvertiser as any).mongo_id;
    const ids: EntityIds = {};
    if (typeof bsId === 'number') ids.broadstreet_id = bsId;
    if (typeof mongoId === 'string') ids.mongo_id = mongoId;
    if (!ids.broadstreet_id && !ids.mongo_id) return null;
    return {
      ids,
      id: typeof bsId === 'number' ? bsId : (mongoId as string),
      name: (selectedAdvertiser as any).name || String(bsId ?? mongoId),
      type: 'advertiser' as const,
    };
  }, [selectedAdvertiser]);

  const campaign = useMemo(() => {
    if (!selectedCampaign) return null;
    const bsId = (selectedCampaign as any).broadstreet_campaign_id ?? (selectedCampaign as any).broadstreet_id ?? (selectedCampaign as any).id;
    const mongoId = (selectedCampaign as any).local_campaign_id ?? (selectedCampaign as any).mongo_id;
    const ids: EntityIds = {};
    if (typeof bsId === 'number') ids.broadstreet_id = bsId;
    if (typeof mongoId === 'string') ids.mongo_id = mongoId;
    if (!ids.broadstreet_id && !ids.mongo_id) return null;
    return {
      ids,
      id: typeof bsId === 'number' ? bsId : (mongoId as string),
      name: (selectedCampaign as any).name || String(bsId ?? mongoId),
      type: 'campaign' as const,
    };
  }, [selectedCampaign]);

  const zones = useMemo(() => {
    if (!Array.isArray(selectedZones)) return [];
    return selectedZones.map((zone) => {
      const raw = typeof zone === 'string'
        ? zone
        : (typeof zone === 'number')
          ? String(zone)
          : ((zone as any)?.id != null ? String((zone as any).id) : '');
      const ids: EntityIds = {};
      const asNumber = Number(raw);
      if (raw && Number.isFinite(asNumber)) ids.broadstreet_id = asNumber;
      else if (raw) ids.mongo_id = raw;
      const label = raw || '';
      return { ids, id: (ids.broadstreet_id as number) ?? (ids.mongo_id as string), name: label, type: 'zone' as const };
    }).filter(z => z.ids.broadstreet_id !== undefined || z.ids.mongo_id !== undefined);
  }, [selectedZones]);

  const advertisements = useMemo(() => {
    if (!Array.isArray(selectedAdvertisements)) return [];
    return selectedAdvertisements.map((ad) => {
      const raw = typeof ad === 'string'
        ? ad
        : (typeof ad === 'number')
          ? String(ad)
          : ((ad as any)?.id != null ? String((ad as any).id) : '');
      const ids: EntityIds = {};
      const asNumber = Number(raw);
      if (raw && Number.isFinite(asNumber)) ids.broadstreet_id = asNumber;
      else if (raw) ids.mongo_id = raw;
      const label = raw || '';
      return { ids, id: (ids.broadstreet_id as number) ?? (ids.mongo_id as string), name: label, type: 'advertisement' as const };
    }).filter(a => a.ids.broadstreet_id !== undefined || a.ids.mongo_id !== undefined);
  }, [selectedAdvertisements]);

  return { network, advertiser, campaign, zones, advertisements };
}

// Optional alias export for backward-compatibility and migration ease
export const selectedEntities = useSelectedEntities;


