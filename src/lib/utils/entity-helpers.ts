export type EntityIds = { broadstreet_id?: number; mongo_id?: string };

export interface EntityWithIds<TType extends string = string> {
  ids: EntityIds;
  id: number | string;
  name: string;
  type: TType;
}

export function getEntityId(entity: { ids?: EntityIds } | null | undefined): number | string | undefined {
  if (!entity || !entity.ids) return undefined;
  const { broadstreet_id, mongo_id } = entity.ids;
  return broadstreet_id ?? mongo_id;
}

export function isEntitySynced(entity: { ids?: EntityIds } | null | undefined): boolean {
  return Boolean(entity && entity.ids && entity.ids.broadstreet_id !== undefined);
}

export function getEntityType(entity: { ids?: EntityIds } | null | undefined): 'synced' | 'local' | 'both' | 'none' {
  if (!entity || !entity.ids) return 'none';
  const hasBs = entity.ids.broadstreet_id !== undefined;
  const hasMongo = entity.ids.mongo_id !== undefined;
  if (hasBs && hasMongo) return 'both';
  if (hasBs) return 'synced';
  if (hasMongo) return 'local';
  return 'none';
}


