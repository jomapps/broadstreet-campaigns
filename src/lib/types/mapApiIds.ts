export type IdMappable = { id?: number } & Record<string, unknown>;

/**
 * mapApiIds
 * Temporary helper to convert legacy API payloads that use `id` into
 * objects that use `broadstreet_id`. Leaves original fields intact unless
 * you pass stripId=true to remove the legacy `id` key.
 */
export function mapApiIds<T extends IdMappable>(obj: T, options?: { stripId?: boolean }): Omit<T, 'id'> & { broadstreet_id?: number } {
  const { stripId = false } = options || {};
  const broadstreet_id = typeof obj.id === 'number' ? obj.id : undefined;
  const clone: any = { ...obj };
  if (stripId) delete clone.id;
  return { ...clone, broadstreet_id };
}


