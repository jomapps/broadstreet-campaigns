export type EntityIds = { broadstreet_id?: number; mongo_id?: string };

export interface EntityWithIds<TType extends string = string> {
  ids: EntityIds;
  id: number | string;
  name: string;
  type: TType;
}

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


