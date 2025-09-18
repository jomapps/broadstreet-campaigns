# Variable Naming Style Guide - Single Source of Truth

## Overview

This document establishes **strict variable naming conventions** for the Broadstreet Campaigns application. All variable names must follow these patterns to ensure consistency, maintainability, and alignment with the database schema.

## Core Principles

### 1. **Database Schema Alignment**
- Variable names MUST match database field names exactly
- Use the same casing, underscores, and spelling as defined in the database models
- Never deviate from the database schema naming

### 2. **Singular Form Convention**
- Use singular forms for entity variables: `network`, `advertiser`, `campaign`, `zone`, `advertisement`
- Collections use plural forms: `networks`, `advertisers`, `campaigns`, `zones`, `advertisements`
- Local entities follow the same pattern: `localAdvertiser`, `localZone`, `localCampaign`

### 3. **Three-Tier ID System Compliance**
- Always use: `broadstreet_id`, `mongo_id`, `_id`
- Never use: `id`, `mongodb_id`, `mongoId`, `objectId`, `broadstreet_*_id`, `local_*_id`

## Entity Variable Naming

### **Synced Entities (from Broadstreet API)**

```typescript
// ✅ CORRECT - Singular entity variables
const network: NetworkEntity = ...;
const advertiser: AdvertiserEntity = ...;
const campaign: CampaignEntity = ...;
const zone: ZoneEntity = ...;
const advertisement: AdvertisementEntity = ...;

// ✅ CORRECT - Plural collection variables
const networks: NetworkEntity[] = ...;
const advertisers: AdvertiserEntity[] = ...;
const campaigns: CampaignEntity[] = ...;
const zones: ZoneEntity[] = ...;
const advertisements: AdvertisementEntity[] = ...;

// ✅ CORRECT - Selected entity variables
const selectedNetwork: NetworkEntity | null = ...;
const selectedAdvertiser: AdvertiserEntity | null = ...;
const selectedCampaign: CampaignEntity | null = ...;
```

### **Local Entities (created locally before sync)**

```typescript
// ✅ CORRECT - Local entity variables
const localAdvertiser: LocalAdvertiserEntity = ...;
const localZone: LocalZoneEntity = ...;
const localCampaign: LocalCampaignEntity = ...;
const localNetwork: LocalNetworkEntity = ...;
const localAdvertisement: LocalAdvertisementEntity = ...;

// ✅ CORRECT - Local collection variables
const localAdvertisers: LocalAdvertiserEntity[] = ...;
const localZones: LocalZoneEntity[] = ...;
const localCampaigns: LocalCampaignEntity[] = ...;
const localNetworks: LocalNetworkEntity[] = ...;
const localAdvertisements: LocalAdvertisementEntity[] = ...;
```

### **Hybrid and Special Entities**

```typescript
// ✅ CORRECT - Placement variables
const placement: PlacementEntity = ...;
const placements: PlacementEntity[] = ...;

// ✅ CORRECT - Theme variables
const theme: ThemeEntity = ...;
const themes: ThemeEntity[] = ...;

// ✅ CORRECT - Sync log variables
const syncLog: SyncLogEntity = ...;
const syncLogs: SyncLogEntity[] = ...;
```

## Database Field Naming

### **ID Fields - Strict Three-Tier System**

```typescript
// ✅ REQUIRED - Standard ID fields
entity.broadstreet_id        // Broadstreet API identifier (number)
entity.mongo_id              // MongoDB ObjectId as string
entity._id                   // MongoDB native ObjectId (internal use only)

// ❌ FORBIDDEN - Never use these patterns
entity.id                    // Too ambiguous
entity.mongodb_id            // Wrong spelling
entity.mongoId               // Wrong case
entity.objectId              // Wrong concept
entity.broadstreet_advertiser_id  // Redundant when context is clear
entity.local_advertiser_id        // Use mongo_id instead
```

### **Sync Tracking Fields**

```typescript
// ✅ REQUIRED - Exact database field names
entity.created_locally       // boolean
entity.synced_with_api       // boolean
entity.created_at           // Date
entity.synced_at            // Date
entity.original_broadstreet_id  // number (for local entities)
entity.sync_errors          // string[]
```

### **Entity-Specific Fields**

```typescript
// ✅ REQUIRED - Network fields
network.web_home_url        // NOT webHomeUrl or web_home_URL
network.valet_active        // NOT valetActive
network.advertiser_count    // NOT advertiserCount
network.zone_count          // NOT zoneCount

// ✅ REQUIRED - Zone fields
zone.self_serve            // NOT selfServe
zone.advertisement_count   // NOT advertisementCount
zone.allow_duplicate_ads   // NOT allowDuplicateAds
zone.concurrent_campaigns  // NOT concurrentCampaigns
zone.advertisement_label   // NOT advertisementLabel
zone.display_type          // NOT displayType
zone.rotation_interval     // NOT rotationInterval
zone.animation_type        // NOT animationType
zone.rss_shuffle          // NOT rssShuffle
zone.size_type            // NOT sizeType
zone.size_number          // NOT sizeNumber
zone.is_home              // NOT isHome

// ✅ REQUIRED - Campaign fields
campaign.start_date           // NOT startDate
campaign.end_date            // NOT endDate
campaign.max_impression_count // NOT maxImpressionCount
campaign.display_type        // NOT displayType
campaign.pacing_type         // NOT pacingType
campaign.impression_max_type // NOT impressionMaxType
campaign.weight_raw          // NOT weightRaw
campaign.display_type_raw    // NOT displayTypeRaw
campaign.start_date_raw      // NOT startDateRaw
campaign.end_date_raw        // NOT endDateRaw

// ✅ REQUIRED - Advertisement fields
advertisement.updated_at        // NOT updatedAt
advertisement.active_placement  // NOT activePlacement
advertisement.preview_url       // NOT previewUrl
```

## Function and Method Naming

### **Entity Operations**

```typescript
// ✅ CORRECT - CRUD operations
function createNetwork(data: NetworkEntity): Promise<NetworkEntity>
function getNetwork(id: number): Promise<NetworkEntity | null>
function updateNetwork(id: number, data: Partial<NetworkEntity>): Promise<NetworkEntity>
function deleteNetwork(id: number): Promise<void>

// ✅ CORRECT - Collection operations
function getNetworks(filters?: NetworkFilters): Promise<NetworkEntity[]>
function getAdvertisers(networkId?: number): Promise<AdvertiserEntity[]>
function getCampaigns(params: CampaignFilters): Promise<CampaignEntity[]>

// ✅ CORRECT - Local entity operations
function createLocalAdvertiser(data: LocalAdvertiserEntity): Promise<LocalAdvertiserEntity>
function getLocalZones(): Promise<LocalZoneEntity[]>
function syncLocalCampaign(campaign: LocalCampaignEntity): Promise<CampaignEntity>
```

### **ID Resolution Functions**

```typescript
// ✅ CORRECT - Using standardized utility functions
function getEntityId(entity: BaseEntity): EntitySelectionKey | undefined
function isEntitySynced(entity: BaseEntity): boolean
function getEntityType(entity: BaseEntity): EntitySyncStatus
function resolveSidebarFilterId(filterValue: any): { broadstreet_id?: number; mongo_id?: string }

// ✅ CORRECT - Entity-specific resolution
function resolveAdvertiserBroadstreetId(ref: { broadstreet_id?: number; mongo_id?: string }): Promise<number | null>
function resolveZoneBroadstreetId(ref: { broadstreet_id?: number; mongo_id?: string }): Promise<number | null>
```

## Component and Hook Naming

### **Component Props**

```typescript
// ✅ CORRECT - Entity props
interface NetworkCardProps {
  network: NetworkEntity;
  selectedNetworks: NetworkEntity[];
  onNetworkSelect: (network: NetworkEntity) => void;
}

interface AdvertiserListProps {
  advertisers: AdvertiserEntity[];
  localAdvertisers: LocalAdvertiserEntity[];
  selectedAdvertiser: AdvertiserEntity | null;
}

// ✅ CORRECT - ID props (explicit naming when needed)
interface EntityIdBadgeProps {
  broadstreet_id?: number;
  mongo_id?: string;
  // NOT: id, broadstreet_advertiser_id, local_advertiser_id
}
```

### **Hook Variables**

```typescript
// ✅ CORRECT - Hook state variables
const [selectedNetwork, setSelectedNetwork] = useState<NetworkEntity | null>(null);
const [selectedAdvertiser, setSelectedAdvertiser] = useState<AdvertiserEntity | null>(null);
const [selectedZones, setSelectedZones] = useState<string[]>([]);
const [selectedAdvertisements, setSelectedAdvertisements] = useState<string[]>([]);

// ✅ CORRECT - Loading and error states
const [isLoadingNetworks, setIsLoadingNetworks] = useState(false);
const [isLoadingAdvertisers, setIsLoadingAdvertisers] = useState(false);
const [networkError, setNetworkError] = useState<string | null>(null);
const [advertiserError, setAdvertiserError] = useState<string | null>(null);
```

## API and Database Query Naming

### **API Endpoint Variables**

```typescript
// ✅ CORRECT - API response variables
const networksResponse: NetworksResponse = await api.getNetworks();
const advertisersResponse: AdvertisersResponse = await api.getAdvertisers(networkId);
const campaignsResponse: CampaignsResponse = await api.getCampaigns(params);

// ✅ CORRECT - Extracted data variables
const networks: NetworkEntity[] = networksResponse.networks;
const advertisers: AdvertiserEntity[] = advertisersResponse.advertisers;
const campaigns: CampaignEntity[] = campaignsResponse.campaigns;
```

### **Database Query Variables**

```typescript
// ✅ CORRECT - Query result variables
const network = await Network.findOne({ broadstreet_id: networkId }).lean();
const advertisers = await Advertiser.find({ network_id: networkId }).lean();
const localZones = await LocalZone.find({ synced_with_api: false }).lean();

// ✅ CORRECT - Query parameter variables
const networkId = parseInt(params.network);
const advertiserId = parseInt(params.advertiser);
const campaignId = parseInt(params.campaign);
```

## Zustand Store Naming

### **Store State Variables**

```typescript
// ✅ CORRECT - Entity collections in store
interface EntityState {
  networks: NetworkEntity[];
  advertisers: AdvertiserEntity[];
  campaigns: CampaignEntity[];
  zones: ZoneEntity[];
  advertisements: AdvertisementEntity[];
  
  // Local entities
  localZones: LocalZoneEntity[];
  localAdvertisers: LocalAdvertiserEntity[];
  localCampaigns: LocalCampaignEntity[];
  localNetworks: LocalNetworkEntity[];
  localAdvertisements: LocalAdvertisementEntity[];
  localPlacements: PlacementEntity[];
}

// ✅ CORRECT - Filter state variables
interface FilterState {
  selectedNetwork: NetworkEntity | null;
  selectedAdvertiser: AdvertiserEntity | null;
  selectedCampaign: CampaignEntity | null;
  selectedZones: string[];
  selectedAdvertisements: string[];
  selectedTheme: ThemeEntity | null;
}
```

### **Store Action Names**

```typescript
// ✅ CORRECT - Action function names
interface EntityActions {
  setNetworks: (networks: NetworkEntity[]) => void;
  setAdvertisers: (advertisers: AdvertiserEntity[]) => void;
  setCampaigns: (campaigns: CampaignEntity[]) => void;
  setZones: (zones: ZoneEntity[]) => void;
  setAdvertisements: (advertisements: AdvertisementEntity[]) => void;
  
  setLocalEntities: (entities: {
    zones: LocalZoneEntity[];
    advertisers: LocalAdvertiserEntity[];
    campaigns: LocalCampaignEntity[];
    networks: LocalNetworkEntity[];
    advertisements: LocalAdvertisementEntity[];
    placements: PlacementEntity[];
  }) => void;
}
```

## Common Anti-Patterns to Avoid

### **❌ FORBIDDEN Patterns**

```typescript
// ❌ WRONG - Generic naming
const data = ...;
const items = ...;
const entities = ...;
const records = ...;

// ❌ WRONG - Inconsistent casing
const webHomeUrl = ...;        // Should be: web_home_url
const valetActive = ...;       // Should be: valet_active
const createdLocally = ...;    // Should be: created_locally
const syncedWithApi = ...;     // Should be: synced_with_api

// ❌ WRONG - Abbreviated names
const net = ...;               // Should be: network
const adv = ...;               // Should be: advertiser
const camp = ...;              // Should be: campaign
const ad = ...;                // Should be: advertisement

// ❌ WRONG - Plural entity variables
const networks = getNetwork(); // Should be: network
const advertisers = getAdvertiser(); // Should be: advertiser

// ❌ WRONG - Mixed ID naming
const id = entity.broadstreet_id || entity.mongo_id;  // Use getEntityId() instead
const mongodbId = entity._id.toString();             // Should be: mongo_id
const broadstreetAdvertiserId = advertiser.broadstreet_id; // Should be: broadstreet_id
```

## Enforcement and Validation

### **ESLint Rules (Recommended)**

```json
{
  "rules": {
    "camelcase": ["error", {
      "properties": "never",
      "ignoreDestructuring": true,
      "allow": [
        "broadstreet_id", "mongo_id", "_id",
        "created_locally", "synced_with_api", "created_at", "synced_at",
        "web_home_url", "valet_active", "advertiser_count", "zone_count",
        "self_serve", "advertisement_count", "allow_duplicate_ads",
        "concurrent_campaigns", "advertisement_label", "display_type",
        "rotation_interval", "animation_type", "rss_shuffle",
        "size_type", "size_number", "is_home",
        "start_date", "end_date", "max_impression_count", "pacing_type",
        "impression_max_type", "weight_raw", "display_type_raw",
        "start_date_raw", "end_date_raw", "updated_at", "active_placement",
        "preview_url", "original_broadstreet_id", "sync_errors"
      ]
    }]
  }
}
```

### **TypeScript Strict Mode**

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noImplicitThis": true
  }
}
```

## Summary

Following these naming conventions ensures:

1. **Consistency**: All variables follow the same patterns
2. **Database Alignment**: Variable names match database schema exactly
3. **Type Safety**: Proper TypeScript integration with comprehensive interfaces
4. **Maintainability**: Clear, predictable naming makes code easier to understand and modify
5. **ID System Compliance**: Proper integration with the three-tier ID system

**Remember**: When in doubt, always refer to the database schema and use the exact field names as defined in the models.
