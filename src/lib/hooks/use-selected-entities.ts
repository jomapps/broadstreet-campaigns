'use client';

import { useMemo } from 'react';
import { useFilters } from '@/contexts/FilterContext';
import { getEntityId } from '@/lib/utils/entity-helpers';

type EntityType = 'network' | 'advertiser' | 'campaign' | 'zone' | 'advertisement';

export type EntityIds = { broadstreet_id?: number; mongo_id?: string };

export type BaseSelectedEntity<T extends EntityType> = {
  ids: EntityIds;
  // Legacy convenience entityId for existing consumers (number when broadstreet_id present, else string mongo_id)
  entityId: number | string;
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
    const bsId = (selectedNetwork as any).broadstreet_network_id ?? getEntityId(selectedNetwork);
    const networkMongoId = (selectedNetwork as any).mongo_id;
    const ids: EntityIds = {};
    if (typeof bsId === 'number') ids.broadstreet_id = bsId;
    if (typeof networkMongoId === 'string') ids.mongo_id = networkMongoId;
    if (!ids.broadstreet_id && !ids.mongo_id) return null;
    return {
      ids,
      entityId: typeof bsId === 'number' ? bsId : (networkMongoId as string),
      name: (selectedNetwork as any).name || String(bsId ?? networkMongoId),
      type: 'network' as const,
    };
  }, [selectedNetwork]);

  const advertiser = useMemo(() => {
    if (!selectedAdvertiser) return null;
    const bsId = (selectedAdvertiser as any).broadstreet_id;
    const advertiserMongoId = (selectedAdvertiser as any).mongo_id;
    const ids: EntityIds = {};
    if (typeof bsId === 'number') ids.broadstreet_id = bsId;
    if (typeof advertiserMongoId === 'string') ids.mongo_id = advertiserMongoId;
    if (!ids.broadstreet_id && !ids.mongo_id) return null;
    return {
      ids,
      entityId: typeof bsId === 'number' ? bsId : (advertiserMongoId as string),
      name: (selectedAdvertiser as any).name || String(bsId ?? advertiserMongoId),
      type: 'advertiser' as const,
    };
  }, [selectedAdvertiser]);

  const campaign = useMemo(() => {
    if (!selectedCampaign) return null;
    const bsId = (selectedCampaign as any).broadstreet_campaign_id ?? getEntityId(selectedCampaign);
    const campaignMongoId = (selectedCampaign as any).mongo_id;
    const ids: EntityIds = {};
    if (typeof bsId === 'number') ids.broadstreet_id = bsId;
    if (typeof campaignMongoId === 'string') ids.mongo_id = campaignMongoId;
    if (!ids.broadstreet_id && !ids.mongo_id) return null;
    return {
      ids,
      entityId: typeof bsId === 'number' ? bsId : (campaignMongoId as string),
      name: (selectedCampaign as any).name || String(bsId ?? campaignMongoId),
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
      return { ids, entityId: getEntityId(ids) ?? '', name: label, type: 'zone' as const };
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
      return { ids, entityId: getEntityId(ids) ?? '', name: label, type: 'advertisement' as const };
    }).filter(a => a.ids.broadstreet_id !== undefined || a.ids.mongo_id !== undefined);
  }, [selectedAdvertisements]);

  return { network, advertiser, campaign, zones, advertisements };
}

// Optional alias export for backward-compatibility and migration ease
export const selectedEntities = useSelectedEntities;


