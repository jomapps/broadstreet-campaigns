/**
 * STANDARDIZED ID MANAGEMENT UTILITIES - SINGLE SOURCE OF TRUTH
 *
 * This file implements the three-tier ID system:
 * 1. broadstreet_id (number) - Broadstreet API identifiers
 * 2. mongo_id (string) - MongoDB ObjectId as string
 * 3. _id (ObjectId) - MongoDB native identifier (internal use only)
 *
 * RULES:
 * - NEVER use generic "id"
 * - NEVER use "mongodb_id" - always use "mongo_id"
 * - NEVER use legacy explicit naming like "broadstreet_advertiser_id"
 */

export type EntitySelectionKey = string | number;

export interface StandardEntity {
  broadstreet_id?: number;
  mongo_id?: string;
  _id?: string;
}

/**
 * Extract the primary ID from any entity, preferring Broadstreet ID over MongoDB ID
 * This is the SINGLE SOURCE OF TRUTH for entity ID extraction
 */
export function getEntityId(entity: StandardEntity | null | undefined): EntitySelectionKey | undefined {
  if (!entity) return undefined;

  // Priority 1: Broadstreet ID (preferred for synced entities)
  if (typeof entity.broadstreet_id === 'number') {
    return entity.broadstreet_id;
  }

  // Priority 2: MongoDB ID string (for local-only entities)
  if (typeof entity.mongo_id === 'string' && entity.mongo_id.length > 0) {
    return entity.mongo_id;
  }

  // Priority 3: MongoDB ObjectId as string (fallback)
  if (typeof entity._id === 'string' && entity._id.length > 0) {
    return entity._id;
  }

  return undefined;
}

/**
 * Determine if an entity is synced with Broadstreet API
 * This is the SINGLE SOURCE OF TRUTH for sync status detection
 */
export function isEntitySynced(entity: StandardEntity | null | undefined): boolean {
  if (!entity) return false;
  return typeof entity.broadstreet_id === 'number';
}

/**
 * Classify entity sync status comprehensively
 * This is the SINGLE SOURCE OF TRUTH for entity type classification
 */
export function getEntityType(entity: StandardEntity | null | undefined): 'synced' | 'local' | 'both' | 'none' {
  if (!entity) return 'none';

  const hasBroadstreetId = typeof entity.broadstreet_id === 'number';
  const hasMongoId = (typeof entity.mongo_id === 'string' && entity.mongo_id.length > 0) ||
                     (typeof entity._id === 'string' && entity._id.length > 0);

  if (hasBroadstreetId && hasMongoId) return 'both';
  if (hasBroadstreetId) return 'synced';
  if (hasMongoId) return 'local';
  return 'none';
}

/**
 * Generate a consistent selection key for entity identification
 * Used by zone selection, theme management, and other entity operations
 */
export function getEntitySelectionKey(entity: StandardEntity | null | undefined): EntitySelectionKey | undefined {
  return getEntityId(entity);
}

/**
 * ID VALIDATION AND CONVERSION UTILITIES
 */

/**
 * Validate if a string is a valid MongoDB ObjectId format
 */
export function isValidMongoId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Validate if a number is a valid Broadstreet ID format
 */
export function isValidBroadstreetId(id: number): boolean {
  return Number.isInteger(id) && id > 0;
}

/**
 * Convert MongoDB ObjectId to string (mongo_id)
 */
export function objectIdToMongoId(objectId: any): string | undefined {
  if (!objectId) return undefined;
  const str = objectId.toString();
  return isValidMongoId(str) ? str : undefined;
}

/**
 * SIDEBAR FILTER ID RESOLUTION
 * The sidebar can provide either broadstreet_id or mongo_id
 * This is the SINGLE SOURCE OF TRUTH for resolving sidebar filter IDs
 */
export function resolveSidebarFilterId(filterValue: any): { broadstreet_id?: number; mongo_id?: string } {
  // Handle numeric values (Broadstreet IDs)
  if (typeof filterValue === 'number' && isValidBroadstreetId(filterValue)) {
    return { broadstreet_id: filterValue };
  }

  // Handle string values (MongoDB IDs)
  if (typeof filterValue === 'string') {
    if (isValidMongoId(filterValue)) {
      return { mongo_id: filterValue };
    }
    // Try to parse as number (string representation of Broadstreet ID)
    const parsed = parseInt(filterValue, 10);
    if (!isNaN(parsed) && isValidBroadstreetId(parsed)) {
      return { broadstreet_id: parsed };
    }
  }

  // Handle objects with explicit ID fields
  if (typeof filterValue === 'object' && filterValue !== null) {
    const result: { broadstreet_id?: number; mongo_id?: string } = {};

    if (typeof filterValue.broadstreet_id === 'number' && isValidBroadstreetId(filterValue.broadstreet_id)) {
      result.broadstreet_id = filterValue.broadstreet_id;
    }

    if (typeof filterValue.mongo_id === 'string' && isValidMongoId(filterValue.mongo_id)) {
      result.mongo_id = filterValue.mongo_id;
    }

    if (result.broadstreet_id || result.mongo_id) {
      return result;
    }
  }

  return {};
}

/**
 * LEGACY COMPATIBILITY FUNCTIONS
 * These functions maintain backward compatibility with existing sync code
 */

/**
 * Resolve Broadstreet ID from entity (legacy compatibility)
 * @deprecated Use getEntityId() instead for new code
 */
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


