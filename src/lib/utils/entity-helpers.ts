export type EntityIds = { broadstreet_id?: number; mongo_id?: string };

export function getEntityId(entity: { ids?: EntityIds } | Record<string, unknown> | null | undefined): number | string | undefined {
  if (!entity) return undefined;
  // Prefer normalized shape
  const ids = (entity as any).ids as EntityIds | undefined;
  if (ids) {
    return ids.broadstreet_id ?? ids.mongo_id;
  }
  // Fallback to top-level standard fields
  const bs = (entity as any).broadstreet_id as number | undefined;
  const mongo = (entity as any).mongo_id as string | undefined;
  if (bs != null) return bs;
  if (mongo != null) return mongo;
  // Fallback to explicit naming convention fields broadstreet_*_id / local_*_id
  const keys = Object.keys(entity as any);
  const bsKey = keys.find(k => /^broadstreet_.*_id$/.test(k));
  if (bsKey && typeof (entity as any)[bsKey] === 'number') return (entity as any)[bsKey] as number;
  const localKey = keys.find(k => /^local_.*_id$/.test(k));
  if (localKey && typeof (entity as any)[localKey] === 'string') return (entity as any)[localKey] as string;
  return undefined;
}

export function isEntitySynced(entity: { ids?: EntityIds } | Record<string, unknown> | null | undefined): boolean {
  if (!entity) return false;
  const ids = (entity as any).ids as EntityIds | undefined;
  if (ids) return ids.broadstreet_id !== undefined;
  if ((entity as any).broadstreet_id !== undefined) return true;
  // Also consider explicit naming
  return Object.keys(entity as any).some(k => /^broadstreet_.*_id$/.test(k) && typeof (entity as any)[k] === 'number');
}

export function getEntityType(entity: { ids?: EntityIds } | Record<string, unknown> | null | undefined): 'synced' | 'local' | 'both' | 'none' {
  if (!entity) return 'none';
  const ids = (entity as any).ids as EntityIds | undefined;
  let hasBs = false;
  let hasMongo = false;
  if (ids) {
    hasBs = ids.broadstreet_id !== undefined;
    hasMongo = ids.mongo_id !== undefined;
  } else {
    hasBs = (entity as any).broadstreet_id !== undefined || Object.keys(entity as any).some(k => /^broadstreet_.*_id$/.test(k));
    hasMongo = (entity as any).mongo_id !== undefined || Object.keys(entity as any).some(k => /^local_.*_id$/.test(k));
  }
  if (hasBs && hasMongo) return 'both';
  if (hasBs) return 'synced';
  if (hasMongo) return 'local';
  return 'none';
}

// Consolidated ID resolution functions (replaces duplicates in sync-helpers.ts)
export async function resolveBroadstreetId(
  entity: { broadstreet_id?: number; mongo_id?: string; original_broadstreet_id?: number } | null | undefined,
  LocalModel?: any
): Promise<number | null> {
  if (!entity) return null;

  // If already has broadstreet_id, return it
  if (typeof entity.broadstreet_id === 'number') {
    return entity.broadstreet_id;
  }

  // If has original_broadstreet_id (for local entities), return it
  if (typeof entity.original_broadstreet_id === 'number') {
    return entity.original_broadstreet_id;
  }

  // If has mongo_id and LocalModel provided, try to resolve from local entity
  if (entity.mongo_id && LocalModel) {
    try {
      const localEntity = await LocalModel.findById(entity.mongo_id).lean();
      if (localEntity?.original_broadstreet_id) {
        return localEntity.original_broadstreet_id;
      }
    } catch (_) {
      // Ignore errors and return null
    }
  }

  return null;
}

// Helper to clean up legacy indexes (consolidates duplicate code)
export async function cleanupLegacyIndexes(Model: any, indexName: string = 'id_1'): Promise<void> {
  try {
    const indexes = await Model.collection.indexes();
    const legacy = indexes.find((i: any) => i.name === indexName);
    if (legacy) {
      await Model.collection.dropIndex(indexName);
    }
  } catch (_) {
    // Ignore errors - index might not exist
  }
}

// Helper to generate composite keys for placement deduplication
export function generatePlacementKey(placement: {
  advertisement_id: number;
  campaign_id?: number;
  campaign_mongo_id?: string;
  zone_id?: number;
  zone_mongo_id?: string;
}): string {
  const campaignKey = typeof placement.campaign_id === 'number'
    ? String(placement.campaign_id)
    : (placement.campaign_mongo_id || '');
  const zoneKey = typeof placement.zone_id === 'number'
    ? String(placement.zone_id)
    : (placement.zone_mongo_id || '');
  return `${campaignKey}-${placement.advertisement_id}-${zoneKey}`;
}


