// Centralized Lean Entity Types - Single Source of Truth
// These types represent the actual database structure for lean queries
// Use these instead of defining duplicate types in component files

/**
 * STANDARDIZED THREE-TIER ID SYSTEM
 *
 * 1. broadstreet_id: number - Broadstreet API identifier
 * 2. mongo_id: string - MongoDB ObjectId as string (application use)
 * 3. _id: string - MongoDB native ObjectId (internal use only)
 *
 * RULES:
 * - NEVER use generic "id"
 * - NEVER use "mongo_db_id" - always use "mongo_id"
 * - NEVER use legacy explicit naming like "advertiser_broadstreet_id"
 */

/**
 * Base fields present in all MongoDB documents
 */
export interface BaseLeanEntity {
  _id: string;                    // MongoDB native ObjectId (internal)
  mongo_id?: string;              // MongoDB ObjectId as string (application use)
  broadstreet_id?: number;        // Broadstreet API identifier
  __v: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Zone entity from lean queries
 * Represents both synced zones (from Broadstreet) and local zones
 */
export interface ZoneLean extends BaseLeanEntity {
  name: string;
  network_id: number;
  alias?: string | null;
  self_serve: boolean;
  size_type?: 'SQ' | 'PT' | 'LS' | 'CS' | null;
  size_number?: number | null;
  category?: string | null;
  block?: string | null;
  is_home?: boolean;
  // Local zone specific fields
  created_locally?: boolean;
  synced_with_api?: boolean;
  created_at?: string;
  synced_at?: string;
  original_broadstreet_id?: number;
  sync_errors?: string[];
  // Additional zone fields
  advertisement_count?: number;
  allow_duplicate_ads?: boolean;
  concurrent_campaigns?: number;
  advertisement_label?: string;
  archived?: boolean;
  display_type?: 'standard' | 'rotation';
  rotation_interval?: number;
  animation_type?: string;
  width?: number;
  height?: number;
  rss_shuffle?: boolean;
  style?: string;
  source?: 'api' | 'local';
}

/**
 * Advertiser entity from lean queries
 * Represents both synced advertisers (from Broadstreet) and local advertisers
 */
export interface AdvertiserLean extends BaseLeanEntity {
  broadstreet_id?: number; // Present for synced advertisers
  name: string;
  logo?: { url: string };
  web_home_url?: string;
  notes?: string | null;
  admins?: Array<{ name: string; email: string }>;
  network_id?: number;
  // Local advertiser specific fields
  created_locally?: boolean;
  synced_with_api?: boolean;
  created_at?: string;
  synced_at?: string;
  original_broadstreet_id?: number;
  sync_errors?: string[];
}

/**
 * Campaign entity from lean queries
 * Represents both synced campaigns (from Broadstreet) and local campaigns
 */
export interface CampaignLean extends BaseLeanEntity {
  broadstreet_id?: number; // Present for synced campaigns
  name: string;
  advertiser_id: number | string;
  start_date: string;
  end_date?: string;
  active: boolean;
  weight: number;
  max_impression_count?: number;
  notes?: string;
  display_type: 'no_repeat' | 'allow_repeat_campaign' | 'allow_repeat_advertisement' | 'force_repeat_campaign';
  path: string;
  archived?: boolean;
  pacing_type?: 'asap' | 'even';
  impression_max_type?: 'cap' | 'goal';
  paused?: boolean;
  network_id?: number;
  // Local campaign specific fields
  created_locally?: boolean;
  synced_with_api?: boolean;
  created_at?: string;
  synced_at?: string;
  original_broadstreet_id?: number;
  sync_errors?: string[];
  // Embedded placements
  placements?: Array<{
    advertisement_id: number;
    zone_id: number;
    restrictions?: string[];
  }>;
  // Raw fields for API round-tripping
  weight_raw?: string;
  display_type_raw?: string;
  start_date_raw?: string;
  end_date_raw?: string;
  raw?: Record<string, unknown>;
}

/**
 * Advertisement entity from lean queries
 * Advertisements can be synced or local (created locally before sync)
 */
export interface AdvertisementLean extends BaseLeanEntity {
  broadstreet_id?: number; // Present for synced advertisements, may be missing for local ones
  name: string;
  updated_at: string;
  type: string;
  advertiser: string;
  active: {
    url?: string | null;
  };
  active_placement: boolean;
  preview_url: string;
  notes?: string;
  network_id?: number;
  // Sync tracking (always synced, but fields may be present)
  created_locally?: boolean;
  synced_with_api?: boolean;
  created_at?: string;
  synced_at?: string;
}

/**
 * Network entity from lean queries
 * Networks are always synced - cannot be created locally
 */
export interface NetworkLean extends BaseLeanEntity {
  broadstreet_id: number; // Always present - networks are always synced
  name: string;
  group_id?: number | null;
  web_home_url?: string;
  logo?: { url: string };
  valet_active: boolean;
  path: string;
  advertiser_count?: number;
  zone_count?: number;
  // Sync tracking (always synced, but fields may be present)
  created_locally?: boolean;
  synced_with_api?: boolean;
  created_at?: string;
  synced_at?: string;
}

/**
 * Placement entity from lean queries
 * Complex entity with flexible ID references
 */
export interface PlacementLean extends BaseLeanEntity {
  // Entity relationships - always required
  network_id: number;           // Always Broadstreet ID
  advertiser_id: number;        // Always Broadstreet ID
  advertisement_id: number;     // Always Broadstreet ID
  
  // Campaign reference - flexible (either Broadstreet ID or MongoDB ID)
  campaign_id?: number;         // Broadstreet ID (if synced campaign)
  campaign_mongo_id?: string;   // MongoDB ObjectId (if local campaign)
  
  // Zone reference - flexible (either Broadstreet ID or MongoDB ID)
  zone_id?: number;             // Broadstreet ID (if synced zone)
  zone_mongo_id?: string;       // MongoDB ObjectId (if local zone)
  
  // Optional placement configuration
  restrictions?: string[];
  
  // Local tracking metadata
  created_locally?: boolean;
  synced_with_api?: boolean;
  created_at?: string;
  synced_at?: string;
  sync_errors?: string[];
  
  // Populated entity data (from joins/lookups)
  advertisement?: {
    broadstreet_id: number;
    mongo_id: string;
    name: string;
    type: string;
  } | null;
  campaign?: {
    broadstreet_id?: number;
    mongo_id?: string;
    name: string;
    start_date: string;
    end_date?: string;
  } | null;
  zone?: {
    broadstreet_id?: number;
    mongo_id?: string;
    name: string;
    alias?: string | null;
  } | null;
  advertiser?: {
    broadstreet_id?: number;
    mongo_id?: string;
    name: string;
  } | null;
  network?: {
    broadstreet_id: number;
    mongo_id: string;
    name: string;
  } | null;
}

/**
 * Theme entity from lean queries
 * Themes are local-only entities that reference synced zones
 */
export interface ThemeLean extends BaseLeanEntity {
  name: string;
  description?: string;
  zone_ids: number[]; // Array of Broadstreet zone IDs
  zone_count: number;
}

/**
 * Helper type for entity selection keys
 * Use this for consistent selection logic across components
 */
export type EntitySelectionKey = string | number;

/**
 * DEPRECATED: Use getEntityId from @/lib/utils/entity-helpers instead
 * This function is kept for backward compatibility only
 */
export function getEntitySelectionKey(entity: { broadstreet_id?: number; mongo_id?: string; _id: string }): EntitySelectionKey {
  if (entity.broadstreet_id != null) return entity.broadstreet_id;
  if (entity.mongo_id != null) return entity.mongo_id;
  return entity._id;
}

/**
 * DEPRECATED: Use isEntitySynced from @/lib/utils/entity-helpers instead
 * This function is kept for backward compatibility only
 */
export function isEntitySynced(entity: { broadstreet_id?: number; synced_with_api?: boolean }): boolean {
  return entity.broadstreet_id != null && entity.synced_with_api !== false;
}
