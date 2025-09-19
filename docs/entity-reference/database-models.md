# Database Models - Single Source of Truth

## Overview

This document serves as the **single source of truth** for all database model definitions in the Broadstreet Campaigns application. It provides a comprehensive overview of each entity's structure, relationships, business rules, and **Zustand store integration patterns**.

The application uses a **dual-database architecture** with MongoDB as the local database and the Broadstreet API as the remote data source. Data synchronization occurs at two specific points: Dashboard "Sync Data" (download from Broadstreet) and Local-Only "Upload to Broadstreet" (upload to Broadstreet).

## Zustand Store Integration

All database models are fully integrated with the **Zustand store architecture** as defined in `docs/implementation/zustand-implementation.md`. Key integration points:

- **Server-Side Data Fetching**: Models are fetched server-side and passed to client components for store initialization
- **Type Safety**: All models use comprehensive TypeScript interfaces that align with store state types
- **ID Management**: Models follow the three-tier ID system with proper `EntitySelectionKey` support
- **Variable Naming**: All model fields follow the standardized naming conventions from `docs/variable-origins.md`

## Database Configuration

### Connection Setup
- **Database**: MongoDB
- **Connection**: Cached connection with hot-reload support
- **Environment Variable**: `MONGODB_URI` (required in `.env.local`)
- **Connection File**: `src/lib/mongodb.ts`

### Collection Naming Convention
MongoDB collections are automatically named by Mongoose using lowercase, pluralized model names:
- `Network` model → `networks` collection
- `Advertiser` model → `advertisers` collection
- `LocalZone` model → `localzones` collection
- etc.

## ID Field Naming Convention - Single Source of Truth

The application follows a **strict three-tier ID system** as defined in `docs/entity-reference/ids.md`:

### **The Three ID Types**
1. **`broadstreet_id`**: Broadstreet API IDs (numbers) - for synced entities
2. **`mongo_id`**: MongoDB ObjectIds (strings) - virtual field from `_id`
3. **`_id`**: MongoDB's native ObjectId field - for internal operations only

### **STRICT NAMING RULES**
- ✅ **ALWAYS use**: `broadstreet_id`, `mongo_id`, `_id`
- ❌ **NEVER use**: `id`, `mongodb_id`, `mongoId`, `broadstreet_*_id`, `local_*_id`

**Reference**: See `docs/entity-reference/ids.md` for complete ID management documentation.

## Entity Categories

### Synced Entities (Broadstreet API → MongoDB)
Entities that originate from Broadstreet API and are synced to local MongoDB:
- Networks
- Advertisers
- Zones
- Campaigns
- Advertisements

**Zustand Store Integration**: Stored in main entity collections (`networks`, `advertisers`, `zones`, `campaigns`, `advertisements`) within the `EntityState`.

### Local-Only Entities
Entities created locally that can optionally be uploaded to Broadstreet:
- Local Advertisers
- Local Zones
- Local Campaigns
- Local Advertisements
- Local Networks

**Zustand Store Integration**: Stored in separate local collections (`localAdvertisers`, `localZones`, `localCampaigns`, `localAdvertisements`, `localNetworks`) within the `EntityState`.

### Hybrid Entities
Entities that can reference both synced and local entities:
- Placements (can reference local campaigns/zones or synced ones)

**Zustand Store Integration**: Stored in `localPlacements` collection with flexible ID referencing using `EntitySelectionKey` patterns.

### Application-Specific Entities
Entities that exist only in the local application:
- Themes
- Sync Logs

**Zustand Store Integration**: Themes are managed through the filter store (`selectedTheme`) and entity store for theme data.

---

## Synced Entity Models

### Network Model
**Collection**: `networks`
**File**: `src/lib/models/network.ts`

#### Interface: `INetwork`
```typescript
interface INetwork extends Document {
  broadstreet_id: number;           // Required, unique
  mongo_id: string;                 // Virtual field
  name: string;                     // Required
  group_id?: number | null;
  web_home_url?: string;
  logo?: { url: string };
  valet_active: boolean;            // Default: false
  path: string;                     // Required
  advertiser_count?: number;        // Default: 0
  zone_count?: number;              // Default: 0
  notes?: string;

  // Sync tracking
  created_locally?: boolean;        // Default: false
  synced_with_api?: boolean;        // Default: true
  created_at?: Date;
  synced_at?: Date;

  // Mongoose timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

#### Business Rules
- `broadstreet_id` must be unique across all networks
- `path` is required and represents the network's URL path
- Sync tracking fields help manage data synchronization state
- **Default network**: Hardcoded to 'FASH Medien Verlag GmbH - SCHWULISSIMO 9396' (ID: 9396) on app initialization

#### Zustand Store Integration
- **Store Location**: `EntityState.networks` array
- **Selection**: `FilterState.selectedNetwork` (always required, always has `broadstreet_id`)
- **Server Fetching**: `fetchNetworks()` in `src/lib/server/data-fetchers.ts`
- **Variable Naming**: Uses `selectedNetwork` (not `selectedNetworkId`) as per `docs/variable-origins.md`

#### Indexes
- `broadstreet_id` (unique)
- Standard Mongoose timestamps

---

### Advertiser Model
**Collection**: `advertisers`
**File**: `src/lib/models/advertiser.ts`

#### Interface: `IAdvertiser`
```typescript
interface IAdvertiser extends Document {
  broadstreet_id: number;           // Required, unique
  mongo_id: string;                 // Virtual field
  name: string;                     // Required
  logo?: { url: string };
  web_home_url?: string;
  notes?: string | null;
  admins?: Array<{
    name: string;                   // Required
    email: string;                  // Required
  }>;

  // Sync tracking
  created_locally?: boolean;        // Default: false
  synced_with_api?: boolean;        // Default: true
  created_at?: Date;
  synced_at?: Date;
  network_id?: number;

  // Mongoose timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

#### Business Rules
- **Critical**: Advertisements cannot exist without synced advertisers (never local-only)
- `broadstreet_id` must be unique across all advertisers
- Admin contacts are optional but when present, both name and email are required
- `notes` can be explicitly null

#### Zustand Store Integration
- **Store Location**: `EntityState.advertisers` array (synced) + `EntityState.localAdvertisers` array (local-only)
- **Selection**: `FilterState.selectedAdvertiser` (can be synced or local)
- **Server Fetching**: `fetchAdvertisers(networkId)` in `src/lib/server/data-fetchers.ts`
- **ID Resolution**: Uses `EntitySelectionKey` for consistent ID handling across synced/local entities
- **Display**: Local advertisers show with yellowish styling cards and local badges

#### Indexes
- `broadstreet_id` (unique)
- `network_id`

---

### Zone Model
**Collection**: `zones`
**File**: `src/lib/models/zone.ts`

#### Interface: `IZone`
```typescript
interface IZone extends Document {
  broadstreet_id: number;           // Required, unique
  mongo_id: string;                 // Virtual field
  name: string;                     // Required
  network_id: number;               // Required
  alias?: string | null;            // Default: null
  self_serve: boolean;              // Default: false

  // Parsed zone information for easier querying
  size_type?: 'SQ' | 'PT' | 'LS' | null;
  size_number?: number | null;
  category?: string | null;
  block?: string | null;
  is_home?: boolean;                // Default: false

  // Sync tracking
  created_locally?: boolean;        // Default: false
  synced_with_api?: boolean;        // Default: true
  created_at?: Date;
  synced_at?: Date;

  // Mongoose timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

#### Business Rules
- `broadstreet_id` must be unique across all zones
- `network_id` is required and references the parent network
- Parsed fields (`size_type`, `size_number`, etc.) are extracted from zone names for easier querying
- Local zones should display MongoDB IDs with local badges when `broadstreet_id` is undefined

#### Zustand Store Integration
- **Store Location**: `EntityState.zones` array (synced) + `EntityState.localZones` array (local-only)
- **Selection**: `FilterState.selectedZones` array of `EntitySelectionKey` values
- **Server Fetching**: `fetchZones(networkId)` in `src/lib/server/data-fetchers.ts`
- **Theme Integration**: Zone selection automatically updates when theme is selected (`setSelectedTheme`)
- **Filtering**: Complex filtering by size types, network gating, search, and theme integration

#### Indexes
- `broadstreet_id` (unique)
- `network_id`
- `size_type`
- `category`

---

### Campaign Model
**Collection**: `campaigns`
**File**: `src/lib/models/campaign.ts`

#### Interface: `ICampaign`
```typescript
interface ICampaign extends Document {
  broadstreet_id: number;           // Required, unique
  mongo_id: string;                 // Virtual field
  name: string;                     // Required
  advertiser_id: number;            // Required
  start_date?: string;
  end_date?: string;
  max_impression_count?: number;
  display_type?: 'no_repeat' | 'allow_repeat_campaign' | 'allow_repeat_advertisement' | 'force_repeat_campaign';
  active: boolean;                  // Required
  weight?: number;
  path: string;                     // Required
  archived?: boolean;               // Default: false
  pacing_type?: 'asap' | 'even';
  impression_max_type?: 'cap' | 'goal';
  paused?: boolean;                 // Default: false
  notes?: string;
  placements?: Array<{
    advertisement_id: number;       // Required
    zone_id: number;                // Required
    restrictions?: string[];
  }>;

  // Raw fields to preserve API payload for future write-backs
  weight_raw?: string;
  display_type_raw?: string;
  start_date_raw?: string;
  end_date_raw?: string;
  raw?: Record<string, unknown>;

  // Sync tracking
  created_locally?: boolean;        // Default: false
  synced_with_api?: boolean;        // Default: true
  created_at?: Date;
  synced_at?: Date;
  network_id?: number;

  // Mongoose timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

#### Business Rules
- `broadstreet_id` must be unique across all campaigns
- `advertiser_id` is required and must reference a valid advertiser
- `active` status is required for campaign state management
- Raw fields preserve original API values for robust round-tripping
- Placements array contains advertisement and zone references with optional restrictions
- **Display Rule**: Placements should not be displayed on the campaigns page even though they are attached to campaigns

#### Zustand Store Integration
- **Store Location**: `EntityState.campaigns` array (synced) + `EntityState.localCampaigns` array (local-only)
- **Selection**: `FilterState.selectedCampaign` (can be synced or local)
- **Server Fetching**: `fetchCampaigns({ networkId, advertiserId })` in `src/lib/server/data-fetchers.ts`
- **Advanced Functionality**: Copy-to-theme, delete operations, status filtering
- **Placement Management**: Complex relationships with creation modal integration

#### Indexes
- `broadstreet_id` (unique)
- `advertiser_id`
- `active`

---

### Advertisement Model
**Collection**: `advertisements`
**File**: `src/lib/models/advertisement.ts`

#### Interface: `IAdvertisement`
```typescript
interface IAdvertisement extends Document {
  broadstreet_id: number;           // Required, unique
  mongo_id: string;                 // Virtual field
  network_id?: number;
  name: string;                     // Required
  updated_at: string;               // Required
  type: string;                     // Required
  advertiser: string;               // Required
  active: {
    url?: string | null;            // Default: null
  };
  active_placement: boolean;        // Required
  preview_url: string;              // Required
  notes?: string;

  // Sync tracking
  created_locally?: boolean;        // Default: false
  synced_with_api?: boolean;        // Default: true
  created_at?: Date;
  synced_at?: Date;

  // Mongoose timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

#### Business Rules
- `broadstreet_id` must be unique across all advertisements
- `preview_url` is required and may need special handling patterns (check advertisements page for correct image display pattern)
- `active_placement` indicates if the advertisement is currently placed
- `active.url` can be explicitly null

#### Zustand Store Integration
- **Store Location**: `EntityState.advertisements` array (always synced - never local-only)
- **Selection**: `FilterState.selectedAdvertisements` array of `EntitySelectionKey` values
- **Server Fetching**: `fetchAdvertisements(networkId)` in `src/lib/server/data-fetchers.ts`
- **Filtering**: Type filtering, active status filtering, advertiser-specific filtering
- **Display**: Broadstreet preview URLs may need special handling patterns

#### Indexes
- `broadstreet_id` (unique)

---

## Local-Only Entity Models

### Local Advertiser Model
**Collection**: `localadvertisers`
**File**: `src/lib/models/local-advertiser.ts`

#### Interface: `ILocalAdvertiser`
```typescript
interface ILocalAdvertiser extends Document {
  mongo_id: string;                 // Virtual field
  broadstreet_id?: number;          // Set after successful sync

  // Core Broadstreet API fields
  name: string;                     // Required
  network_id: number;               // Required
  logo?: { url: string };
  web_home_url?: string;
  notes?: string;
  admins?: Array<{
    name: string;                   // Required
    email: string;                  // Required
  }>;

  // Local creation tracking
  created_locally: boolean;         // Default: true
  synced_with_api: boolean;         // Default: false
  created_at: Date;                 // Default: Date.now
  synced_at?: Date;
  original_broadstreet_id?: number;
  sync_errors: string[];            // Default: []

  // Mongoose timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

#### Business Rules
- Created locally first, then optionally synced to Broadstreet
- `broadstreet_id` is set only after successful sync
- `sync_errors` array tracks any synchronization issues
- Should display with yellowish styling cards when local-only

#### Zustand Store Integration
- **Store Location**: `EntityState.localAdvertisers` array
- **Server Fetching**: Included in `fetchLocalEntities()` in `src/lib/server/data-fetchers.ts`
- **Sync Integration**: Managed through sync store and entity store actions
- **Display**: Local-only page displays with proper filtering and management

#### Indexes
- `network_id`
- `created_locally`
- `synced_with_api`

---

### Local Zone Model
**Collection**: `localzones`
**File**: `src/lib/models/local-zone.ts`

#### Interface: `ILocalZone`
```typescript
interface ILocalZone extends Document {
  mongo_id: string;                 // Virtual field
  broadstreet_id?: number;          // Set after successful sync

  // Core Broadstreet API fields
  name: string;                     // Required
  network_id: number;               // Required
  alias?: string;
  self_serve?: boolean;

  // Additional Broadstreet dashboard fields
  advertisement_count?: number;     // Min: 0
  allow_duplicate_ads?: boolean;
  concurrent_campaigns?: number;    // Min: 0
  advertisement_label?: string;
  archived?: boolean;
  display_type?: 'standard' | 'rotation';  // Default: 'standard'
  rotation_interval?: number;       // Min: 1000 (1 second)
  animation_type?: string;
  width?: number;                   // Min: 1
  height?: number;                  // Min: 1
  rss_shuffle?: boolean;
  style?: string;

  // Local creation tracking
  created_locally: boolean;         // Default: true
  synced_with_api: boolean;         // Default: false
  created_at: Date;                 // Default: Date.now
  synced_at?: Date;
  original_broadstreet_id?: number;
  sync_errors: string[];            // Default: []

  // Mongoose timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

#### Business Rules
- Names can be duplicated (no unique constraint on name)
- Alias must be unique per network when defined
- `advertisement_count` allows 0 since zones don't need advertisements to be created
- `rotation_interval` minimum is 1000ms (1 second)
- Dimensions (`width`, `height`) must be at least 1 pixel

#### Zustand Store Integration
- **Store Location**: `EntityState.localZones` array
- **Server Fetching**: Included in `fetchLocalEntities()` in `src/lib/server/data-fetchers.ts`
- **Theme Integration**: Can be included in theme zone selections after sync
- **Filtering**: Complex filtering by size types, network gating, search integration

#### Indexes
- `network_id, name` (non-unique, allows duplicates)
- `network_id, alias` (unique, partial filter for defined aliases)
- `created_locally`
- `synced_with_api`

---

### Local Campaign Model
**Collection**: `localcampaigns`
**File**: `src/lib/models/local-campaign.ts`

#### Interface: `ILocalCampaign`
```typescript
interface ILocalCampaign extends Document {
  mongo_id: string;                 // Virtual field
  broadstreet_id?: number;          // Set after successful sync

  // Core Broadstreet API fields
  name: string;                     // Required
  network_id: number;               // Required
  advertiser_id?: number | string;  // Flexible for local/synced advertisers
  start_date?: string;
  end_date?: string;
  max_impression_count?: number;
  display_type?: 'no_repeat' | 'allow_repeat_campaign' | 'allow_repeat_advertisement' | 'force_repeat_campaign';
  active: boolean;                  // Required
  weight?: number;
  path?: string;
  archived?: boolean;
  pacing_type?: 'asap' | 'even';
  impression_max_type?: 'cap' | 'goal';
  paused?: boolean;
  notes?: string;
  placements?: Array<{
    advertisement_id: number;
    zone_id: number;
    restrictions?: string[];
  }>;

  // Raw fields for API compatibility
  weight_raw?: string;
  display_type_raw?: string;
  start_date_raw?: string;
  end_date_raw?: string;
  raw?: Record<string, unknown>;

  // Local creation tracking
  created_locally: boolean;         // Default: true
  synced_with_api: boolean;         // Default: false
  created_at: Date;                 // Default: Date.now
  synced_at?: Date;
  original_broadstreet_id?: number;
  sync_errors: string[];            // Default: []

  // Mongoose timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

#### Business Rules
- `advertiser_id` can be either a number (Broadstreet ID) or string (MongoDB ObjectId)
- `active` status is required for campaign management
- Raw fields preserve original values for API compatibility

#### Zustand Store Integration
- **Store Location**: `EntityState.localCampaigns` array
- **Server Fetching**: Included in `fetchLocalEntities()` in `src/lib/server/data-fetchers.ts`
- **Placement Management**: Embedded placements handled during sync and creation
- **Advanced Functionality**: Copy-to-theme, delete operations, status filtering

#### Indexes
- `network_id`
- `advertiser_id`
- `active`
- `created_locally`
- `synced_with_api`

---

### Local Advertisement Model
**Collection**: `localadvertisements`
**File**: `src/lib/models/local-advertisement.ts`

#### Interface: `ILocalAdvertisement`
```typescript
interface ILocalAdvertisement extends Document {
  mongo_id: string;                 // Virtual field
  broadstreet_id?: number;          // Set after successful sync

  // Core Broadstreet API fields
  name: string;                     // Required
  network_id: number;               // Required
  type: string;                     // Required
  advertiser?: string;
  advertiser_id?: number;
  active?: { url?: string | null };
  active_placement?: boolean;
  preview_url?: string;
  notes?: string;

  // Local creation tracking
  created_locally: boolean;         // Default: true
  synced_with_api: boolean;         // Default: false
  created_at: Date;                 // Default: Date.now
  synced_at?: Date;
  original_broadstreet_id?: number;
  sync_errors: string[];            // Default: []

  // Mongoose timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

#### Business Rules
- `type` is required and defines the advertisement format
- `advertiser_id` should reference a valid advertiser
- `preview_url` may need special handling patterns

#### Indexes
- `network_id`
- `advertiser_id`
- `created_locally`
- `synced_with_api`

---

### Local Network Model
**Collection**: `localnetworks`
**File**: `src/lib/models/local-network.ts`

#### Interface: `ILocalNetwork`
```typescript
interface ILocalNetwork extends Document {
  mongo_id: string;                 // Virtual field
  broadstreet_id?: number;          // Set after successful sync

  // Core Broadstreet API fields
  name: string;                     // Required
  group_id?: number;
  web_home_url?: string;
  logo?: { url: string };
  valet_active?: boolean;           // Default: false
  path?: string;
  advertiser_count?: number;        // Default: 0
  zone_count?: number;              // Default: 0
  notes?: string;

  // Local creation tracking
  created_locally: boolean;         // Default: true
  synced_with_api: boolean;         // Default: false
  created_at: Date;                 // Default: Date.now
  synced_at?: Date;
  original_broadstreet_id?: number;
  sync_errors: string[];            // Default: []

  // Mongoose timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

#### Business Rules
- `name` is required for network identification
- `path` is optional for local networks (required after sync)
- Count fields track associated entities

#### Indexes
- `name`
- `created_locally`
- `synced_with_api`

---

## Hybrid Entity Models

### Placement Model
**Collection**: `placements`
**File**: `src/lib/models/placement.ts`

#### Interface: `IPlacement`
```typescript
interface IPlacement extends Document {
  // Entity relationships - all required for clear data lineage
  network_id: number;               // Always Broadstreet ID (guaranteed to exist)
  advertiser_id: number;            // Always Broadstreet ID (guaranteed to exist)
  advertisement_id: number;         // Always Broadstreet ID (guaranteed to exist)

  // Campaign reference - flexible for local/synced campaigns (XOR constraint)
  campaign_id?: number;             // Broadstreet ID (if synced campaign)
  campaign_mongo_id?: string;       // MongoDB ObjectId (if local campaign)

  // Zone reference - flexible for local/synced zones (XOR constraint)
  zone_id?: number;                 // Broadstreet ID (if synced zone)
  zone_mongo_id?: string;           // MongoDB ObjectId (if local zone)

  // Optional placement configuration
  restrictions?: string[];

  // Local tracking metadata
  created_locally: boolean;         // Default: true
  synced_with_api: boolean;         // Default: false
  created_at: Date;                 // Default: Date.now
  synced_at?: Date;
  sync_errors: string[];            // Default: []

  // Mongoose timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

#### Business Rules
- **XOR Constraint**: Exactly one of `campaign_id` OR `campaign_mongo_id` must be provided
- **XOR Constraint**: Exactly one of `zone_id` OR `zone_mongo_id` must be provided
- `network_id`, `advertiser_id`, and `advertisement_id` are always Broadstreet IDs
- Placement cards should show campaign name/id, advertisement name/id, and zone name/id
- Can reference both local and synced campaigns/zones
- **CRITICAL**: Never delete synced placements from the Placement collection during normal operations

#### Zustand Store Integration
- **Store Location**: `EntityState.localPlacements` array (local-only placements)
- **Server Fetching**: Included in `fetchLocalEntities()` in `src/lib/server/data-fetchers.ts`
- **Complex Relationships**: Creation modal integration with campaign/zone/advertisement selection
- **Flexible ID Support**: Uses `EntitySelectionKey` for consistent ID handling across local/synced entities
- **Display**: Local-only page displays with proper entity relationship information

#### Indexes
- `network_id`
- `advertiser_id`
- `advertisement_id`
- `campaign_id`
- `campaign_mongo_id`
- `zone_id`
- `zone_mongo_id`
- `created_locally`

---

## Application-Specific Entity Models

### Theme Model
**Collection**: `themes`
**File**: `src/lib/models/theme.ts`

#### Interface: `ITheme`
```typescript
interface ITheme extends Document {
  mongo_id: string;                 // Virtual field
  name: string;                     // Required, max 100 chars
  description?: string;             // Max 500 chars
  zone_ids: number[];               // Array of Broadstreet zone IDs (synced zones only)
  zone_count: number;               // Virtual field for display

  // Mongoose timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

#### Business Rules
- **Synced zones only**: `zone_ids` can only contain Broadstreet zone IDs, not local zones
- `name` is required and limited to 100 characters
- `description` is optional and limited to 500 characters
- `zone_count` is a virtual field calculated from `zone_ids.length`
- **Theme Selection**: Selecting a theme should clear currently selected zones and set all zones of the selected theme as selected
- **Mutual Exclusivity**: Selecting a theme should replace currently selected zones with the theme's zones

#### Zustand Store Integration
- **Store Location**: Managed through filter store (`FilterState.selectedTheme`)
- **Zone Integration**: Theme selection automatically updates `FilterState.selectedZones` with theme's zone IDs
- **Server Fetching**: Themes are fetched as needed for theme-specific functionality
- **Sidebar Filters**: Theme selection follows existing Zustand patterns from `zustand-implementation.md`

#### Indexes
- `name`
- `zone_ids`
- `createdAt` (descending)

---

### Sync Log Model
**Collection**: `synclogs`
**File**: `src/lib/models/sync-log.ts`

#### Interface: `ISyncLog`
```typescript
interface ISyncLog extends Document {
  networkId: number;                // Required
  syncType: 'full' | 'incremental' | 'retry';  // Default: 'full'
  status: 'pending' | 'running' | 'success' | 'error' | 'cancelled';  // Default: 'pending'
  startTime: Date;                  // Required, default: Date.now
  endTime?: Date;
  duration?: number;                // milliseconds

  // Phase tracking
  phases: ISyncPhase[];
  currentPhase?: string;

  // Overall statistics
  totalEntities: number;            // Default: 0
  processedEntities: number;        // Default: 0
  successfulEntities: number;       // Default: 0
  failedEntities: number;           // Default: 0
  skippedEntities: number;          // Default: 0

  // Progress tracking
  progressPercentage: number;       // Default: 0, range: 0-100
  estimatedTimeRemaining?: number;  // milliseconds

  // Error tracking
  errorSummary?: string;
  criticalErrors: string[];

  // Legacy fields for backward compatibility
  entity?: string;
  recordCount?: number;
  error?: string;

  // Mongoose timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

#### Sub-Interface: `ISyncPhase`
```typescript
interface ISyncPhase {
  phase: 'validation' | 'advertisers' | 'zones' | 'campaigns' | 'placements' | 'cleanup';
  status: 'pending' | 'running' | 'success' | 'error' | 'skipped';  // Default: 'pending'
  startTime: Date;                  // Required
  endTime?: Date;
  duration?: number;                // milliseconds
  totalEntities: number;            // Default: 0
  processedEntities: number;        // Default: 0
  successfulEntities: number;       // Default: 0
  failedEntities: number;           // Default: 0
  skippedEntities: number;          // Default: 0
  operations: ISyncOperation[];
  errorSummary?: string;
}
```

#### Sub-Interface: `ISyncOperation`
```typescript
interface ISyncOperation {
  entityType: 'advertiser' | 'zone' | 'campaign' | 'placement';
  entityId: string;                 // MongoDB ObjectId or Broadstreet ID
  entityName: string;               // Required
  operation: 'create' | 'update' | 'link' | 'skip';
  status: 'success' | 'error' | 'retry' | 'skipped';
  errorCode?: 'DUPLICATE' | 'DEPENDENCY' | 'NETWORK' | 'VALIDATION' | 'AUTH' | 'LINKED_DUPLICATE';
  errorMessage?: string;
  retryCount?: number;              // Default: 0
  broadstreetId?: number;
  duration?: number;                // milliseconds
  timestamp: Date;                  // Default: Date.now
}
```

#### Business Rules
- Tracks detailed synchronization operations between local MongoDB and Broadstreet API
- Phases represent different stages of the sync process
- Operations track individual entity sync attempts
- Legacy fields maintain backward compatibility

#### Indexes
- `networkId`
- `status`
- `syncType`
- `createdAt` (descending)
- `startTime` (descending)
- `phases.phase`
- `phases.status`
- `entity` (legacy)

---

## Data Relationships and Business Rules

### Entity Hierarchy
```
Network (1)
├── Advertisers (N) - synced only
│   ├── Campaigns (N) - synced or local
│   └── Advertisements (N) - synced only
├── Zones (N) - synced or local
└── Placements (N) - hybrid references
    ├── Campaign (1) - can be local or synced
    ├── Zone (1) - can be local or synced
    ├── Advertisement (1) - always synced
    └── Advertiser (1) - always synced
```

### Critical Business Rules

1. **Advertiser Dependency**: Advertisements cannot exist without synced advertisers (never local-only)

2. **ID Display Rules**:
   - Local zones should display MongoDB IDs with local badges when `broadstreet_id` is undefined
   - Local-only entities should be displayed with yellowish styling cards
   - Small local badges should appear next to entity IDs when entities are local-only

3. **Placement References**:
   - Must reference synced advertisers and advertisements (Broadstreet IDs)
   - Can reference either local or synced campaigns/zones
   - XOR constraints ensure exactly one campaign reference and one zone reference

4. **Sync Points**:
   - Dashboard "Sync Data": Download from Broadstreet API to MongoDB
   - Local-Only "Upload to Broadstreet": Upload local entities to Broadstreet API
   - No automatic polling or background sync

5. **Data Integrity**:
   - User prefers to drop database and resync for clean start when implementing major data structure changes
   - Sync tracking fields help manage synchronization state
   - Error tracking in local entities helps debug sync issues

### Virtual Fields

All models include standardized virtual fields following the three-tier ID system:
- **`mongo_id`**: String representation of MongoDB's `_id` field (all models)
- **`broadstreet_id`**: Returns `original_broadstreet_id` (local models only)
- Enabled via `toJSON: { virtuals: true }` and `toObject: { virtuals: true }`
- Lean queries supported via `mongoose-lean-virtuals` plugin

**Note**: Legacy entity-specific virtuals (e.g., `local_advertiser_id`, `broadstreet_advertiser_id`) have been removed in favor of the standardized system.

### Common Schema Options

All schemas use these common options:
```typescript
{
  timestamps: true,        // Adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  id: false               // Disables virtual 'id' field
}
```

### Database Utilities

#### Scripts
- `scripts/db-backup.js`: MongoDB backup using mongodump
- `scripts/db-restore.js`: MongoDB restore using mongorestore
- `scripts/db-drop.js`: Drop entire database
- `scripts/db-reset.js`: Drop and reseed with test data

#### Connection Management
- `src/lib/mongodb.ts`: Cached connection with hot-reload support
- Global connection caching prevents connection growth during development
- Graceful error handling and connection cleanup

---

## Migration and Maintenance

### Schema Evolution
- Models use Mongoose's built-in schema versioning
- Raw fields preserve API payloads for robust round-tripping
- Legacy fields maintain backward compatibility during transitions

### Index Management
- Unique constraints on `broadstreet_id` fields prevent duplicates
- Compound indexes optimize common query patterns
- Partial indexes (e.g., alias uniqueness) handle optional fields

### Data Cleanup
- `cleanupLegacyIndexes()` utility handles index migrations
- Sync logs track data integrity issues
- Error arrays in local entities help debug sync problems

---

## Development Guidelines

### Model Creation Checklist
1. ✅ Define TypeScript interface extending `Document`
2. ✅ Create Mongoose schema with proper validation
3. ✅ Add appropriate indexes for query optimization
4. ✅ Include virtual `mongo_id` getter
5. ✅ Add `mongoose-lean-virtuals` plugin
6. ✅ Export model with `mongoose.models.X || mongoose.model<IX>('X', XSchema)`
7. ✅ Document business rules and relationships
8. ✅ Add sync tracking fields for local entities

### Query Best Practices
1. Use `lean()` for read-only operations to improve performance
2. Include virtuals with `lean()` queries using the plugin
3. Leverage indexes for filtering and sorting
4. Use compound indexes for multi-field queries
5. Consider pagination for large result sets

### Sync Implementation Guidelines
1. Always validate entity relationships before sync
2. Use bulk operations for better performance
3. Track sync errors in local entities
4. Implement retry logic for transient failures
5. Preserve raw API data for round-trip compatibility

---

## Zustand Store Integration Patterns

### Server-Side Data Fetching Pattern

All database models follow the standardized server-side data fetching pattern as defined in `docs/implementation/zustand-implementation.md`:

```typescript
// Server-side page component
export default async function Page({ searchParams }: PageProps) {
  // 1. Await searchParams (Next.js 15 requirement)
  const params = await searchParams;

  // 2. Fetch necessary data server-side using data fetchers
  const [networks, advertisers, zones] = await Promise.all([
    fetchNetworks(),
    fetchAdvertisers(networkId),
    fetchZones(networkId),
  ]);

  // 3. Pass data to client component for store initialization
  return (
    <PageClient
      initialNetworks={networks}
      initialAdvertisers={advertisers}
      initialZones={zones}
      searchParams={params}
    />
  );
}

// Client component initializes stores with server data
'use client';
export default function PageClient({ initialNetworks, initialAdvertisers, initialZones, searchParams }) {
  const { setNetworks, setAdvertisers, setZones } = useEntityStore();
  const { setFiltersFromParams } = useFilterStore();

  useEffect(() => {
    // Initialize entity store with server data
    setNetworks(initialNetworks);
    setAdvertisers(initialAdvertisers);
    setZones(initialZones);

    // Initialize filters from URL parameters
    setFiltersFromParams(searchParams);
  }, [initialNetworks, initialAdvertisers, initialZones, searchParams]);

  return <PageContent />;
}
```

### Entity Store Type Integration

All database models are fully integrated with the `EntityState` type system:

```typescript
// Store state follows database model interfaces exactly
interface EntityState {
  // Synced entities (always have broadstreet_id)
  networks: NetworkEntity[];
  advertisers: AdvertiserEntity[];
  campaigns: CampaignEntity[];
  zones: ZoneEntity[];
  advertisements: AdvertisementEntity[];

  // Local entities (created locally before sync)
  localZones: LocalZoneEntity[];
  localAdvertisers: LocalAdvertiserEntity[];
  localCampaigns: LocalCampaignEntity[];
  localNetworks: LocalNetworkEntity[];
  localAdvertisements: LocalAdvertisementEntity[];
  localPlacements: PlacementEntity[];

  // Loading and error states for each entity type
  isLoading: { networks: boolean; advertisers: boolean; /* ... */ };
  errors: { networks: string | null; advertisers: string | null; /* ... */ };
}
```

### Filter Store Integration

Database models integrate with the filter store for entity selection:

```typescript
interface FilterState {
  // Selected entities use full entity objects for rich data access
  selectedNetwork: NetworkEntity | null;       // Always required, always has broadstreet_id
  selectedAdvertiser: AdvertiserEntity | null; // Can be synced or local
  selectedCampaign: CampaignEntity | null;     // Can be synced or local

  // Selection arrays use EntitySelectionKey for consistent ID handling
  selectedZones: EntitySelectionKey[];         // Array of broadstreet_id or mongo_id strings
  selectedAdvertisements: EntitySelectionKey[]; // Array of broadstreet_id or mongo_id strings

  // Theme selection with automatic zone mapping
  selectedTheme: ThemeEntity | null;           // Local-only entity with zone_ids array
}
```

### Variable Naming Compliance

All database model integrations follow the standardized variable naming from `docs/variable-origins.md`:

- **Entity Variables**: `selectedNetwork`, `selectedAdvertiser`, `selectedCampaign` (not `selectedNetworkId`)
- **Collection Variables**: `networks`, `advertisers`, `campaigns`, `zones`, `advertisements`
- **State Variables**: `isLoadingNetworks`, `networkError`, `advertisersLoaded`
- **Action Variables**: `setNetworks`, `setSelectedAdvertiser`, `toggleZoneSelection`

### ID Management Integration

Database models use the three-tier ID system with proper `EntitySelectionKey` support:

```typescript
// Entity selection using utility functions
const entityId = getEntityId(entity);                    // Returns number | string | undefined
const isSynced = isEntitySynced(entity);                 // Returns boolean
const entityType = getEntityType(entity);               // Returns 'synced' | 'local' | 'both' | 'none'

// Store actions with ID resolution
const useEntityStore = create<EntityState & EntityActions>()(
  immer((set, get) => ({
    // Standard setters that preserve ID integrity
    setNetworks: (networks) => set((state) => {
      const validNetworks = networks.filter(n => n.broadstreet_id && n.name);
      state.networks = validNetworks;
    }),

    // Entity operations with ID resolution
    addEntity: (entityType, entity) => set((state) => {
      const entityId = getEntityId(entity);
      if (!entityId) return;
      // Add entity logic with proper ID handling
    }),
  }))
);
```

### Data Serialization Patterns

Server-side data fetchers ensure proper serialization for client-side store initialization:

```typescript
export async function fetchNetworks(): Promise<NetworkEntity[]> {
  await connectDB();
  const networks = await Network.find({}).sort({ name: 1 }).lean();
  return networks.map(network => ({
    ...network,
    _id: network._id.toString(),           // Serialize ObjectId
    mongo_id: network._id.toString(),      // Virtual field
    createdAt: network.createdAt.toISOString(),  // Serialize dates
    updatedAt: network.updatedAt.toISOString(),
    synced_at: network.synced_at?.toISOString(),
  }));
}
```

---

*This document serves as the single source of truth for database models and their Zustand store integration patterns. All model changes should be reflected here immediately to maintain accuracy.*

