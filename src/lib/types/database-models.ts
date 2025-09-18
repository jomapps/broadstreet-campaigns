/**
 * COMPREHENSIVE DATABASE MODEL INTERFACES - SINGLE SOURCE OF TRUTH
 * 
 * This file provides complete TypeScript interfaces for all database models,
 * ensuring type safety throughout the application and proper integration
 * with the three-tier ID system defined in docs/entity-reference/ids.md
 * 
 * CRITICAL RULES:
 * 1. All interfaces follow the three-tier ID system: broadstreet_id, mongo_id, _id
 * 2. Variable names match database schema exactly (singular forms)
 * 3. All optional fields are properly marked with ?
 * 4. Sync tracking fields are consistent across all entities
 * 5. Local entities have proper creation tracking
 */

// =============================================================================
// BASE INTERFACES
// =============================================================================

/**
 * Base interface for all MongoDB documents
 * Provides the three-tier ID system foundation
 */
export interface BaseEntity {
  _id: string;                    // MongoDB native ObjectId (internal use)
  mongo_id?: string;              // MongoDB ObjectId as string (application use)
  broadstreet_id?: number;        // Broadstreet API identifier
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Sync tracking fields for entities that can be synced with Broadstreet API
 */
export interface SyncTrackingFields {
  created_locally?: boolean;      // Default: false for synced, true for local
  synced_with_api?: boolean;      // Default: true for synced, false for local
  created_at?: Date;              // Creation timestamp
  synced_at?: Date;               // Last sync timestamp
}

/**
 * Local entity creation tracking (for entities created locally before sync)
 */
export interface LocalEntityFields extends SyncTrackingFields {
  original_broadstreet_id?: number;  // Broadstreet ID after successful sync
  sync_errors: string[];             // Array of sync error messages
}

// =============================================================================
// SYNCED ENTITY INTERFACES (Broadstreet API → MongoDB)
// =============================================================================

/**
 * Network entity - Always synced, cannot be created locally
 * Collection: networks
 */
export interface NetworkEntity extends BaseEntity {
  broadstreet_id: number;         // Always present - networks are always synced
  name: string;
  group_id?: number | null;
  web_home_url?: string;
  logo?: {
    url: string;
  };
  valet_active: boolean;          // Default: false
  path: string;
  advertiser_count?: number;      // Default: 0
  zone_count?: number;            // Default: 0
  notes?: string;
  // Sync tracking (always synced, but fields may be present)
  created_locally?: boolean;      // Always false
  synced_with_api?: boolean;      // Always true
  created_at?: Date;
  synced_at?: Date;
}

/**
 * Advertiser entity - Can be synced or local
 * Collection: advertisers
 */
export interface AdvertiserEntity extends BaseEntity, SyncTrackingFields {
  broadstreet_id?: number;        // Present for synced advertisers
  name: string;
  logo?: {
    url: string;
  };
  web_home_url?: string;
  notes?: string | null;
  admins?: Array<{
    name: string;
    email: string;
  }>;
  network_id?: number;            // Network association
}

/**
 * Zone entity - Can be synced or local
 * Collection: zones
 */
export interface ZoneEntity extends BaseEntity, SyncTrackingFields {
  broadstreet_id?: number;        // Present for synced zones
  name: string;
  network_id: number;
  alias?: string | null;
  self_serve: boolean;
  // Additional zone fields from Broadstreet dashboard
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
  // Zone size classification
  size_type?: 'SQ' | 'PT' | 'LS' | 'CS' | null;
  size_number?: number | null;
  category?: string | null;
  block?: string | null;
  is_home?: boolean;
}

/**
 * Campaign entity - Can be synced or local
 * Collection: campaigns
 */
export interface CampaignEntity extends BaseEntity, SyncTrackingFields {
  broadstreet_id?: number;        // Present for synced campaigns
  name: string;
  advertiser_id: number | string; // Flexible for local/synced advertisers
  start_date?: string;
  end_date?: string;
  max_impression_count?: number;
  display_type?: 'no_repeat' | 'allow_repeat_campaign' | 'allow_repeat_advertisement' | 'force_repeat_campaign';
  active: boolean;
  weight?: number;
  path?: string;                  // Required after sync
  archived?: boolean;             // Default: false
  pacing_type?: 'asap' | 'even';
  impression_max_type?: 'cap' | 'goal';
  paused?: boolean;               // Default: false
  notes?: string;
  network_id?: number;            // Network association
  // Embedded placements
  placements?: Array<{
    advertisement_id: number;
    zone_id: number;
    restrictions?: string[];
  }>;
  // Raw fields to preserve API payload for future write-backs
  weight_raw?: string;
  display_type_raw?: string;
  start_date_raw?: string;
  end_date_raw?: string;
  raw?: Record<string, unknown>;
}

/**
 * Advertisement entity - Always synced, cannot be created locally
 * Collection: advertisements
 */
export interface AdvertisementEntity extends BaseEntity {
  broadstreet_id: number;         // Always present - advertisements are always synced
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
  created_locally?: boolean;      // Always false
  synced_with_api?: boolean;      // Always true
  created_at?: Date;
  synced_at?: Date;
}

// =============================================================================
// LOCAL ENTITY INTERFACES (Created locally before sync)
// =============================================================================

/**
 * Local Advertiser entity - Created locally before sync to Broadstreet
 * Collection: localadvertisers
 */
export interface LocalAdvertiserEntity extends BaseEntity, LocalEntityFields {
  broadstreet_id?: number;        // Set after successful sync
  name: string;
  network_id: number;
  logo?: {
    url: string;
  };
  web_home_url?: string;
  notes?: string;
  admins?: Array<{
    name: string;
    email: string;
  }>;
  // Local creation tracking
  created_locally: boolean;       // Always true
  synced_with_api: boolean;       // Default: false
  created_at: Date;               // Default: Date.now
}

/**
 * Local Zone entity - Created locally before sync to Broadstreet
 * Collection: localzones
 */
export interface LocalZoneEntity extends BaseEntity, LocalEntityFields {
  broadstreet_id?: number;        // Set after successful sync
  name: string;
  network_id: number;
  alias?: string;
  self_serve?: boolean;
  // Additional Broadstreet dashboard fields (all optional)
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
  // Zone size classification
  size_type?: 'SQ' | 'PT' | 'LS' | 'CS';
  size_number?: number;
  category?: string;
  block?: string;
  is_home?: boolean;
  // Local creation tracking
  created_locally: boolean;       // Always true
  synced_with_api: boolean;       // Default: false
  created_at: Date;               // Default: Date.now
}

/**
 * Local Campaign entity - Created locally before sync to Broadstreet
 * Collection: localcampaigns
 */
export interface LocalCampaignEntity extends BaseEntity, LocalEntityFields {
  broadstreet_id?: number;        // Set after successful sync
  name: string;
  network_id: number;
  advertiser_id?: number | string; // Flexible for local/synced advertisers
  start_date?: string;
  end_date?: string;
  max_impression_count?: number;
  display_type?: 'no_repeat' | 'allow_repeat_campaign' | 'allow_repeat_advertisement' | 'force_repeat_campaign';
  active: boolean;
  weight?: number;
  path?: string;
  archived?: boolean;
  pacing_type?: 'asap' | 'even';
  impression_max_type?: 'cap' | 'goal';
  paused?: boolean;
  notes?: string;
  // Embedded placements
  placements?: Array<{
    advertisement_id: number;
    zone_id: number;
    restrictions?: string[];
  }>;
  // Local creation tracking
  created_locally: boolean;       // Always true
  synced_with_api: boolean;       // Default: false
  created_at: Date;               // Default: Date.now
}

/**
 * Local Network entity - Created locally before sync to Broadstreet
 * Collection: localnetworks
 */
export interface LocalNetworkEntity extends BaseEntity, LocalEntityFields {
  broadstreet_id?: number;        // Set after successful sync
  name: string;
  group_id?: number;
  web_home_url?: string;
  logo?: {
    url: string;
  };
  valet_active?: boolean;
  path?: string;                  // Optional for local networks
  advertiser_count?: number;      // Default: 0
  zone_count?: number;            // Default: 0
  notes?: string;
  // Local creation tracking
  created_locally: boolean;       // Always true
  synced_with_api: boolean;       // Default: false
  created_at: Date;               // Default: Date.now
}

// =============================================================================
// HYBRID ENTITY INTERFACES (Complex relationship management)
// =============================================================================

/**
 * Placement entity - Complex entity with flexible ID references
 * Collection: placements
 *
 * Placements can reference both local and synced entities:
 * - Network, Advertiser, Advertisement: Always Broadstreet IDs (guaranteed to exist)
 * - Campaign, Zone: Can be either Broadstreet IDs or MongoDB IDs (XOR constraint)
 */
export interface PlacementEntity extends BaseEntity {
  // Entity relationships - always required
  network_id: number;             // Always Broadstreet ID
  advertiser_id: number;          // Always Broadstreet ID
  advertisement_id: number;       // Always Broadstreet ID

  // Campaign reference - flexible (XOR constraint: exactly one required)
  campaign_id?: number;           // Broadstreet ID (if synced campaign)
  campaign_mongo_id?: string;     // MongoDB ObjectId (if local campaign)

  // Zone reference - flexible (XOR constraint: exactly one required)
  zone_id?: number;               // Broadstreet ID (if synced zone)
  zone_mongo_id?: string;         // MongoDB ObjectId (if local zone)

  // Optional placement configuration
  restrictions?: string[];

  // Local tracking metadata
  created_locally: boolean;       // Default: true
  synced_with_api: boolean;       // Default: false
  created_at: Date;               // Default: Date.now
  synced_at?: Date;
  sync_errors?: string[];
}

// =============================================================================
// LOCAL-ONLY ENTITY INTERFACES (Never synced to Broadstreet)
// =============================================================================

/**
 * Theme entity - Local-only entity that references synced zones
 * Collection: themes
 *
 * Themes are collections of zones used for bulk operations.
 * They only reference synced zones (Broadstreet IDs).
 */
export interface ThemeEntity extends BaseEntity {
  name: string;
  description?: string;
  zone_ids: number[];             // Array of Broadstreet zone IDs only
  zone_count: number;             // Virtual field for display
  created_at: Date;
  updated_at: Date;
}

// =============================================================================
// SYNC AND AUDIT INTERFACES
// =============================================================================

/**
 * Sync Operation - Individual operation within a sync phase
 */
export interface SyncOperation {
  entityType: 'advertiser' | 'zone' | 'campaign' | 'placement';
  entityId: string;               // MongoDB ObjectId or Broadstreet ID
  entityName: string;
  operation: 'create' | 'update' | 'link' | 'skip';
  status: 'success' | 'error' | 'retry' | 'skipped';
  errorCode?: 'DUPLICATE' | 'DEPENDENCY' | 'NETWORK' | 'VALIDATION' | 'AUTH' | 'LINKED_DUPLICATE';
  errorMessage?: string;
  retryCount?: number;
  broadstreetId?: number;
  duration?: number;              // milliseconds
  timestamp: Date;
}

/**
 * Sync Phase - Phase within a sync log
 */
export interface SyncPhase {
  phase: 'validation' | 'advertisers' | 'zones' | 'campaigns' | 'placements' | 'cleanup';
  status: 'pending' | 'running' | 'success' | 'error' | 'skipped';
  startTime: Date;
  endTime?: Date;
  duration?: number;              // milliseconds
  totalEntities: number;
  processedEntities: number;
  successfulEntities: number;
  failedEntities: number;
  skippedEntities: number;
  operations: SyncOperation[];
  errorSummary?: string;
}

/**
 * Sync Log entity - Complete sync operation log
 * Collection: synclogs
 */
export interface SyncLogEntity extends BaseEntity {
  networkId: number;
  syncType: 'full' | 'incremental' | 'retry';
  status: 'pending' | 'running' | 'success' | 'error' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  duration?: number;              // milliseconds

  // Phase tracking
  phases: SyncPhase[];
  currentPhase?: string;

  // Overall statistics
  totalEntities: number;
  processedEntities: number;
  successfulEntities: number;
  failedEntities: number;
  skippedEntities: number;

  // Error tracking
  errors: Array<{
    phase: string;
    entityType: string;
    entityId: string;
    error: string;
    timestamp: Date;
  }>;

  // Configuration
  config: {
    batchSize: number;
    maxRetries: number;
    delayBetweenRequests: number;
    skipValidation: boolean;
  };

  // Metadata
  triggeredBy: 'manual' | 'scheduled' | 'api';
  userAgent?: string;
  ipAddress?: string;
}

// =============================================================================
// UNION TYPES FOR FLEXIBLE ENTITY HANDLING
// =============================================================================

/**
 * All synced entity types
 */
export type SyncedEntity =
  | NetworkEntity
  | AdvertiserEntity
  | ZoneEntity
  | CampaignEntity
  | AdvertisementEntity;

/**
 * All local entity types
 */
export type LocalEntity =
  | LocalAdvertiserEntity
  | LocalZoneEntity
  | LocalCampaignEntity
  | LocalNetworkEntity
  | LocalAdvertisementEntity;

/**
 * All entity types that can exist in both synced and local forms
 */
export type FlexibleEntity =
  | AdvertiserEntity | LocalAdvertiserEntity
  | ZoneEntity | LocalZoneEntity
  | CampaignEntity | LocalCampaignEntity;

/**
 * All database entity types
 */
export type DatabaseEntity =
  | SyncedEntity
  | LocalEntity
  | PlacementEntity
  | ThemeEntity
  | SyncLogEntity;

// =============================================================================
// UTILITY TYPES FOR COMMON PATTERNS
// =============================================================================

/**
 * Entity with populated relationships (for joins/lookups)
 */
export interface PopulatedPlacementEntity extends PlacementEntity {
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
    start_date?: string;
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
 * Lean query result type (for performance-optimized queries)
 */
export type LeanEntity<T extends DatabaseEntity> = Omit<T, keyof Document> & {
  _id: string;
  createdAt: string;
  updatedAt: string;
  created_at?: string;
  synced_at?: string;
};

/**
 * Entity selection key type (for consistent selection logic)
 */
export type EntitySelectionKey = string | number;

/**
 * Entity sync status classification
 */
export type EntitySyncStatus = 'synced' | 'local' | 'both' | 'none';

/**
 * Local Advertisement entity - Created locally before sync to Broadstreet
 * Collection: localadvertisements
 */
export interface LocalAdvertisementEntity extends BaseEntity, LocalEntityFields {
  broadstreet_id?: number;        // Set after successful sync
  name: string;
  network_id: number;
  advertiser_id?: number | string; // Flexible for local/synced advertisers
  type: string;
  advertiser: string;
  active: {
    url?: string | null;
  };
  active_placement?: boolean;
  preview_url?: string;
  notes?: string;
  updated_at?: string;
  // Local creation tracking
  created_locally: boolean;       // Always true
  synced_with_api: boolean;       // Default: false
  created_at: Date;               // Default: Date.now
}
