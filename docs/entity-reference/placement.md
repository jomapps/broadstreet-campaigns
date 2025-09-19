# Placement System Documentation

## Overview

Placements represent combinations of advertisements and zones within campaigns. The system supports both embedded placements (within campaigns) and standalone placement collections with comprehensive sync capabilities. Placements are fully integrated with the **Zustand store architecture** for complex relationships and creation modal integration.

## ID Management

Placements use a flexible ID system to support both local and synced entities:
- **Required Broadstreet IDs**: `network_id`, `advertiser_id`, `advertisement_id` (always numbers)
- **Flexible Campaign Reference**: Either `campaign_id` (number) OR `campaign_mongo_id` (string) - XOR constraint
- **Flexible Zone Reference**: Either `zone_id` (number) OR `zone_mongo_id` (string) - XOR constraint

**Business Rules**:
- Placement cards should show campaign name/id, advertisement name/id, and zone name/id
- Local-only entities should be displayed with yellowish styling cards
- **CRITICAL**: Never delete synced placements from the Placement collection during normal operations

## Zustand Store Integration

### Store Location
- **Local Placements**: `EntityState.localPlacements` array (local-only placements in dedicated collection)
- **Embedded Placements**: Stored within campaign documents (existing pattern continues)

### Complex Relationships
- **Creation Modal Integration**: Campaign/zone/advertisement selection with validation
- **Flexible ID Support**: Uses `EntitySelectionKey` for consistent ID handling across local/synced entities
- **Entity Enrichment**: Displays campaign, zone, and advertisement information with proper badges

### Server-Side Integration
```typescript
// Server-side data fetching includes local placements
const localEntities = await fetchLocalEntities();
const { placements } = localEntities;

// Client-side store initialization
const { setLocalPlacements } = useEntityStore();
useEffect(() => {
  setLocalPlacements(placements.filter(p =>
    p.network_id && p.advertiser_id && p.advertisement_id &&
    ((p.campaign_id && !p.campaign_mongo_id) || (!p.campaign_id && p.campaign_mongo_id)) &&
    ((p.zone_id && !p.zone_mongo_id) || (!p.zone_id && p.zone_mongo_id))
  ));
}, [placements]);
```

## Parents relationship
Placements are children of campaigns.
Placements combinations of zone and advertisement.
Advertisements are children of Advertisers.



**CRITICAL**
- if a value is not required and it is not provided, it will not be included in the request body.
- other than the id, we never rely on another id.
- when we open a placement creation form, we DO NOT have a placement id. We also dont give it any. We do that only on save.
- fields required by the broadstreet api that are required need to present. They are almost always in the filters section of the sidebar. e.g. network id  and Campaign id are required. If not present, give message.
- in placement duplicate names are allowed.
- We do not create networks or advertisements. They need to be present in the broadstreet api, and will be synced before start of the placement creation process.

**HANDLING LOCAL ADVERTISERS AND CAMPAIGNS**
- we may create local advertisers. they will not have a broadstreet_id, being local. so we just use the mongo_id. later the sync will update the broadstreet_id.
- we may create local campaigns. they will not have a broadstreet_id, being local. so we just use the mongo_id. later the sync will update the broadstreet_id.

**CRITICAL: LOCAL-ONLY ENTITIES AND MONGODB IDS**
- **Local-only entities are NOT synced back to Broadstreet** until explicitly uploaded via "Local-Only > Upload to Broadstreet"
- **Local entities use MongoDB ObjectIds** instead of Broadstreet numeric IDs:
  - Local campaigns: `campaign_mongo_id` (string) instead of `campaign_id` (number)
  - Local zones: `zone_mongo_id` (string) instead of `zone_id` (number)
  - Local advertisers: `advertiser_mongo_id` (string) instead of `advertiser_id` (number)
- **Placements in local campaigns** may reference:
  - `advertisement_id` (number) - Always Broadstreet ID (advertisements are never created locally)
  - `zone_id` (number) - Broadstreet ID for synced zones
  - `zone_mongo_id` (string) - MongoDB ObjectId for local-only zones
  - `campaign_mongo_id` (string) - MongoDB ObjectId of parent local campaign
- **During sync/upload**: Local MongoDB ObjectIds are resolved to Broadstreet numeric IDs
- **API filtering**: The `/api/placements` endpoint handles both ID types for proper network filtering


## How to create a placement

Use the Broadstreet API to create a placement that associates an advertisement with a zone under a campaign.

- Required:
  - `access_token` (query) – found in your environment
  - `campaign_id` (body, required)
  - `advertisement_id` (body, required)
  - `zone_id` (body, required)
- Optional:
  - `restrictions` (body, optional, string)
- Endpoint: `POST https://api.broadstreetads.com/api/1/placements`
- Headers: `Content-Type: application/json`
- Query params:
  - `access_token` (string, required)
- Request body (JSON):
  - `campaign_id` (number, required)
  - `advertisement_id` (number, required)
  - `zone_id` (number, required)
  - `restrictions` (string, optional)

Example cURL
```bash
curl -X POST \
  "https://api.broadstreetads.com/api/1/placements?access_token=$BROADSTREET_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "campaign_id": 67890,
    "advertisement_id": 12345,
    "zone_id": 24680,
    "restrictions": "desktop_only"
  }'
```

Example response (201 Created)
```json
{
  "placement": {
    "advertisement_id": 12345,
    "zone_id": 24680,
    "restrictions": ["desktop_only"]
  }
}
```

TypeScript example (using our API helper)
```ts
import broadstreetAPI from '@/lib/broadstreet-api';

const created = await broadstreetAPI.createPlacement({
  campaign_id: 67890,
  advertisement_id: 12345,
  zone_id: 24680,
  restrictions: 'desktop_only',
});

// created => { advertisement_id, zone_id, campaign_id, restrictions: string[] }
```

Reference: [Broadstreet Placements API v1](https://api.broadstreetads.com/docs/v1#tag/Placements)

## Create locally (in-app, recommended during testing)

- Open the Placements flow from a Campaign (ensure a network and campaign are selected in the sidebar).
- Choose one or more advertisements and one or more zones. The app creates all ad×zone combinations for that campaign.
- On submit, it calls our local endpoint `POST /api/create/placements` and stores the placements on the local campaign document as embedded records.

Local endpoint request
```bash
curl -X POST http://localhost:3000/api/create/placements \
  -H "Content-Type: application/json" \
  -d '{
    "campaign_mongo_id": "68c87564d49cd5ae18663ccf",
    "advertisement_ids": [12345, 12346],
    "zone_ids": [24680, 24681],
    "restrictions": ["desktop_only"]
  }'
```

Local endpoint notes
- Required: either `campaign_mongo_id` (local) or `campaign_broadstreet_id` (number), plus non-empty `advertisement_ids[]` and `zone_ids[]`.
- All `advertisement_ids` and `zone_ids` are strictly normalized to numbers; non-numeric values will be rejected.
- The server builds the Cartesian product of `advertisement_ids × zone_ids` and appends new placements to the local campaign.
- Dedupe: if a placement already exists for the same ad+zone, it is not re-inserted. Existing placements are not modified.
- Restrictions: when provided, they are stored on new placements only and are not used to update existing ones.

What you should see after creating locally
- Placements are embedded under the local campaign and are visible via `GET /api/placements`.
- Campaign cards show a "🏠 Local" badge if the parent campaign is local.
- Data flags: the parent campaign remains `created_locally: true` and `synced_with_api: false` until synced.

## List placements (combined local + synced)

Use the internal endpoint `GET /api/placements` to list placements from synced campaigns and local campaigns together.

Supported query parameters
- `network_id?: number` – Filter by network via zone network.
- `advertiser_id?: number` – Filter by advertiser (applies to synced/local parents).
- `campaign_id?: number` – Filter by Broadstreet campaign id.
- `campaign_mongo_id?: string` – Filter by a specific local campaign.
- `advertisement_id?: number` – Filter by ad.
- `zone_id?: number` – Filter by zone.
- `limit?: number` – Hard cap when no filters are provided (dev safety).

Example
```bash
curl "http://localhost:3000/api/placements?campaign_id=67890&limit=100"
```

Response includes enrichment blocks for `advertisement`, `zone`, `campaign` (local or synced), `advertiser`, and `network` when available.

## Sync local placements to Broadstreet

In-app steps
- Go to Local Only → ensure your network is selected.
- Click “Sync Placements” (or run the placements sync) to create all embedded placements in Broadstreet for synced campaigns in that network.

API
```bash
curl -X POST http://localhost:3000/api/sync/placements \
  -H "Content-Type: application/json" \
  -d '{
    "networkId": 85
  }'
```

What happens
- The service scans local campaigns in the network with `synced_with_api: true` and a valid `original_broadstreet_id`.
- For each embedded placement, it validates dependencies: the campaign and zone must be synced; the advertisement must exist.
- It sends `campaign_id`, `advertisement_id`, `zone_id`, and optional `restrictions` (first value) to Broadstreet.
- Successes and failures are returned per placement; local records are not modified beyond sync execution metadata.

## Delete a placement

- Endpoint: `DELETE https://api.broadstreetads.com/api/1/placements`
- Query params: `access_token`, `campaign_id`, `advertisement_id`, `zone_id`

Example cURL
```bash
curl -X DELETE \
  "https://api.broadstreetads.com/api/1/placements?access_token=$BROADSTREET_API_TOKEN&campaign_id=67890&advertisement_id=12345&zone_id=24680"
```

TypeScript example (using our API helper)
```ts
import broadstreetAPI from '@/lib/broadstreet-api';

await broadstreetAPI.deletePlacement({
  campaign_id: 67890,
  advertisement_id: 12345,
  zone_id: 24680,
});
```

## Data Storage Architecture

**Placements are stored as embedded documents within campaigns**, not as standalone collections:

```typescript
// Campaign document structure
{
  _id: ObjectId("68c87250699c8c01f302ee77"),
  name: "Leo API Campaign 51",
  network_id: 9396,
  placements: [  // ← Embedded placement array
    {
      advertisement_id: 1143797,        // Always Broadstreet ID
      zone_id: 175043,                  // Broadstreet ID (if synced zone)
      zone_mongo_id: "68c123...",       // MongoDB ID (if local zone)
      restrictions: ["desktop_only"]
    }
  ]
}
```

**Key Points:**
- Placements are **attachments to campaigns**, not independent entities
- The `/api/placements` endpoint extracts placements from all campaign documents
- Network filtering works by traversing: `placement → zone → network` or `placement → campaign → advertiser → network`

## Troubleshooting Common Issues

**"No placements found" when placements exist:**
1. **Check zone references**: Placements must have either `zone_id` (number) or `zone_mongo_id` (string)
2. **Verify network relationships**: Zones must be properly associated with the selected network
3. **Local vs synced data**: Local zones use `zone_mongo_id`, synced zones use `zone_id`

**Placement filtering fails:**
- Ensure related entities (zones, campaigns, advertisers) exist and have proper network associations
- Check that local campaigns have `network_id` set correctly
- Verify zone lookup maps are populated during API processing

## Notes
- Access token must be passed as a query parameter to Broadstreet endpoints.
- We never create networks or advertisements as part of placement creation. They must already exist and be synced or selected from synced data.
- Duplicate names are not a concept for placements; local dedupe prevents duplicate ad+zone pairs under a campaign.
- Dates are not part of placement payloads; scheduling is handled at the campaign/ad level in our app. If Broadstreet introduces date-based placement controls, we will adapt.
- Error handling: 401 indicates invalid/missing token; dependency errors occur when campaign/zone are not synced or ad is missing.

Reference: [Broadstreet Placements API v1](https://api.broadstreetads.com/docs/v1#tag/Placements)

## NEW FEATURE: Local Placement Collection

### Overview
We are implementing a **dual-storage architecture** for placements to better support local-only workflows:

- **Local placements**: Stored in a dedicated `placements` collection (new)
- **Broadstreet placements**: Continue to be stored as embedded documents in campaign documents (existing)

### Architecture Design

#### Local Placement Document Structure
```typescript
{
  _id: ObjectId("..."),
  // Entity relationships - all required for clear data lineage
  network_id: number,           // Always Broadstreet ID (guaranteed to exist)
  advertiser_id: number,        // Always Broadstreet ID (guaranteed to exist)
  advertisement_id: number,     // Always Broadstreet ID (guaranteed to exist)

  // Campaign reference - flexible for local/synced campaigns
  campaign_id?: number,         // Broadstreet ID (if synced campaign)
  campaign_mongo_id?: string,   // MongoDB ObjectId (if local campaign)

  // Zone reference - flexible for local/synced zones
  zone_id?: number,             // Broadstreet ID (if synced zone)
  zone_mongo_id?: string,       // MongoDB ObjectId (if local zone)

  // Optional placement configuration
  restrictions?: string[],

  // Local tracking metadata
  created_locally: true,
  synced_with_api: false,
  created_at: Date,
  synced_at?: Date,
  sync_errors?: string[]
}
```

#### Business Rules & Constraints

1. **Unique Placement Constraint**: Each placement must have a unique combination of:
   - `campaign_id` OR `campaign_mongo_id`
   - `zone_id` OR `zone_mongo_id`
   - `advertisement_id`

2. **Entity Dependencies**:
   - `network_id`, `advertiser_id`, `advertisement_id` must always reference existing Broadstreet entities
   - `campaign_id`/`campaign_mongo_id` must reference existing campaign (local or synced)
   - `zone_id`/`zone_mongo_id` must reference existing zone (local or synced)

3. **ID Field Logic**:
   - Exactly one campaign reference: `campaign_id` XOR `campaign_mongo_id`
   - Exactly one zone reference: `zone_id` XOR `zone_mongo_id`

### User Experience Changes

#### Local-Only Page Enhancement
- **New dedicated "Local Placements" section** displaying cards from the placements collection
- Each placement card shows:
  - Campaign name/ID with local badge if applicable
  - Advertisement name/ID
  - Zone name/ID with local badge if applicable
  - Network context
  - **Delete button (×)** in top-right corner for immediate removal

#### Placements Page Enhancement
- **Unified display** showing both:
  - Local placements from the `placements` collection
  - Embedded placements from campaign documents
- **Visual distinction**: Local placement cards use yellowish styling with local badges
- **Enhanced card content**: Display campaign, advertisement, and zone names/IDs

#### Sync & Cleanup Workflow
- **Upload to Broadstreet**: Local placements are synced to Broadstreet API
- **Post-sync cleanup**: Successfully synced local placements are automatically deleted
- **Error handling**: Failed syncs remain in local collection with error details

### Technical Implementation Notes

- **Database indexes**: Compound unique index on campaign+zone+advertisement combinations
- **API endpoints**: New endpoints for local placement CRUD operations
- **Data migration**: Existing embedded placements remain unchanged
- **Backward compatibility**: Existing placement workflows continue to function

## IMPLEMENTATION PLAN

### Phase 1: Database Schema & Model Updates
**Estimated Time: 2-3 hours**

#### Task 1.1: Update Local Placement Model
- [ ] Enhance `src/lib/models/placement.ts` to support the new schema
- [ ] Add flexible campaign/zone ID fields (`campaign_id` OR `campaign_mongo_id`, `zone_id` OR `zone_mongo_id`)
- [ ] Add entity relationship fields (`network_id`, `advertiser_id`)
- [ ] Add local tracking metadata fields
- [ ] Create compound unique index for business rule enforcement
- [ ] Add validation logic for XOR constraints on ID fields

#### Task 1.2: Database Migration Strategy
- [ ] Create database migration script to handle existing data
- [ ] Ensure backward compatibility with embedded placements
- [ ] Test migration with sample data

### Phase 2: API Endpoints Development
**Estimated Time: 4-5 hours**

#### Task 2.1: Local Placement CRUD APIs
- [ ] Create `POST /api/local-placements` - Create local placement with full entity relationships
- [ ] Create `GET /api/local-placements` - List local placements with filtering
- [ ] Create `DELETE /api/local-placements/[id]` - Delete individual local placement
- [ ] Add validation for entity dependencies and unique constraints

#### Task 2.2: Enhanced Placements API
- [ ] Update `GET /api/placements` to include both local and embedded placements
- [ ] Add source identification (local vs embedded) in response
- [ ] Maintain existing filtering capabilities
- [ ] Add entity enrichment for local placements

#### Task 2.3: Sync Integration
- [ ] Update sync service to handle local placement collection
- [ ] Implement post-sync cleanup (delete successfully synced local placements)
- [ ] Add error handling and retry logic
- [ ] Update sync progress tracking

### Phase 3: Frontend Components Enhancement
**Estimated Time: 5-6 hours**

#### Task 3.1: Local-Only Page Updates
- [ ] Add dedicated "Local Placements" section to `src/app/local-only/LocalOnlyDashboard.tsx`
- [ ] Create local placement cards with enhanced entity information
- [ ] Implement delete functionality with confirmation
- [ ] Add loading states and error handling

#### Task 3.2: Placements Page Unification
- [ ] Update `src/app/placements/PlacementsList.tsx` to display unified placement list
- [ ] Add visual distinction for local vs embedded placements
- [ ] Enhance placement cards with campaign/advertisement/zone names and IDs
- [ ] Implement local badge display logic

#### Task 3.3: Placement Creation Flow
- [ ] Update placement creation to use new local collection
- [ ] Modify `src/hooks/usePlacementCreation.ts` to call new API endpoint
- [ ] Add entity relationship validation in frontend
- [ ] Update success/error messaging

### Phase 4: Testing & Validation
**Estimated Time: 3-4 hours**

#### Task 4.1: Unit Testing
- [ ] Test placement model validation and constraints
- [ ] Test API endpoints with various scenarios
- [ ] Test sync functionality with local placements
- [ ] Test unique constraint enforcement

#### Task 4.2: Integration Testing
- [ ] Test complete placement creation workflow
- [ ] Test local-only page functionality
- [ ] Test unified placements page display
- [ ] Test sync and cleanup process

#### Task 4.3: Data Integrity Testing
- [ ] Verify no duplicate placements can be created
- [ ] Test entity relationship validation
- [ ] Test migration script with real data
- [ ] Verify backward compatibility

### Phase 5: Database Reset & Clean Start
**Estimated Time: 1 hour**

#### Task 5.1: Database Cleanup
- [ ] Drop existing MongoDB database
- [ ] Re-sync all data from Broadstreet API
- [ ] Verify clean state with no embedded placements
- [ ] Test new local placement creation

### Implementation Notes

#### Pre-Implementation Checklist
- [ ] Backup current database state
- [ ] Document current placement workflows
- [ ] Identify all placement-related components and APIs
- [ ] Plan rollback strategy if needed

#### Success Criteria
- [ ] Local placements stored in dedicated collection
- [ ] Unified placement display working correctly
- [ ] Local-only page shows placement section
- [ ] Sync process handles local placements
- [ ] No data loss during migration
- [ ] All existing functionality preserved

## Implementation Status

### ✅ **COMPLETED - Production Ready**

The dual placement storage architecture has been successfully implemented and is fully operational.

#### **Core Features Implemented:**
- ✅ **Dual Storage Architecture**: Both embedded placements (in campaigns) and standalone placement collection
- ✅ **Local Placement Collection**: `src/lib/models/placement.ts` with comprehensive schema
- ✅ **MongoDB ID Support**: Flexible referencing with `campaign_mongo_id`, `zone_mongo_id` for local entities
- ✅ **Broadstreet ID Support**: Standard `campaign_id`, `zone_id` for synced entities
- ✅ **Sync Integration**: Full sync support via `/api/sync/placements` and comprehensive sync
- ✅ **API Endpoints**: Complete CRUD operations via `/api/local-placements`
- ✅ **Frontend Integration**: Local-only page displays and manages local placements
- ✅ **Filtering Logic**: Proper filtering of synced vs unsynced placements

#### **API Endpoints Implemented:**
- ✅ `POST /api/local-placements` - Create local placement
- ✅ `GET /api/local-placements` - List local placements with filtering
- ✅ `GET /api/local-placements/[id]` - Get individual placement
- ✅ `DELETE /api/local-placements/[id]` - Delete local placement
- ✅ `POST /api/sync/placements` - Sync placements to Broadstreet

#### **Database Schema:**
- ✅ **Flexible ID References**: Support for both MongoDB ObjectIds and Broadstreet numeric IDs
- ✅ **Sync Tracking**: `created_locally`, `synced_with_api`, `synced_at` fields
- ✅ **Error Handling**: `sync_errors` array for troubleshooting
- ✅ **Comprehensive Indexing**: Optimized queries for all reference types

#### **Broadstreet API Integration:**
- ✅ **Placement Creation**: Handles HTTP 201 Created with empty response body
- ✅ **Parameter Validation**: Correct `restrictions` array format
- ✅ **Error Handling**: Comprehensive error classification and retry logic
- ✅ **ID Resolution**: Automatic conversion from MongoDB IDs to Broadstreet IDs during sync

#### **Frontend Features:**
- ✅ **Local-Only Page**: Displays unsynced placements with proper filtering
- ✅ **Placement Cards**: Shows campaign, zone, and advertisement information
- ✅ **MongoDB ID Display**: Local badges for entities with MongoDB IDs
- ✅ **Sync Integration**: "Sync All to Broadstreet" includes placement sync

**Implementation Time: 19+ hours completed**

**System Status: ✅ FULLY OPERATIONAL**

All placement functionality is production-ready with comprehensive sync capabilities.

## Zustand Store Usage Patterns

### Entity Store Actions
```typescript
// Setting local placements with validation
const { setLocalPlacements } = useEntityStore();

// Local placements with XOR constraint validation
setLocalPlacements(placements.filter(p =>
  p.network_id && p.advertiser_id && p.advertisement_id &&
  ((p.campaign_id && !p.campaign_mongo_id) || (!p.campaign_id && p.campaign_mongo_id)) &&
  ((p.zone_id && !p.zone_mongo_id) || (!p.zone_id && p.zone_mongo_id))
));
```

### Complex Relationship Management
```typescript
// Placement creation with entity relationships
const { localPlacements } = useEntityStore();
const { selectedCampaign, selectedZones, selectedAdvertisements } = useFilterStore();

// Create placements for selected entities
const createPlacements = async () => {
  if (!selectedCampaign) return;

  const campaignId = getEntityId(selectedCampaign);
  const placements = [];

  for (const zoneId of selectedZones) {
    for (const adId of selectedAdvertisements) {
      const placement = {
        network_id: selectedNetwork.broadstreet_id,
        advertiser_id: selectedCampaign.advertiser_id,
        advertisement_id: parseInt(adId),

        // Flexible campaign reference
        ...(typeof campaignId === 'number'
          ? { campaign_id: campaignId }
          : { campaign_mongo_id: campaignId }
        ),

        // Flexible zone reference
        ...(zoneId.match(/^[0-9]+$/)
          ? { zone_id: parseInt(zoneId) }
          : { zone_mongo_id: zoneId }
        ),

        created_locally: true,
        synced_with_api: false,
      };

      placements.push(placement);
    }
  }

  // Create placements via API
  await createLocalPlacements(placements);
};
```

### Placement Filtering and Display
```typescript
// Filter placements by various criteria
const { localPlacements } = useEntityStore();
const { selectedNetwork, selectedCampaign } = useFilterStore();

// Network-based filtering
const networkPlacements = localPlacements.filter(placement =>
  placement.network_id === selectedNetwork?.broadstreet_id
);

// Campaign-based filtering (handles both ID types)
const campaignPlacements = localPlacements.filter(placement => {
  if (!selectedCampaign) return true;

  const campaignId = getEntityId(selectedCampaign);
  if (typeof campaignId === 'number') {
    return placement.campaign_id === campaignId;
  } else {
    return placement.campaign_mongo_id === campaignId;
  }
});

// Entity enrichment for display
const enrichedPlacements = networkPlacements.map(placement => ({
  ...placement,
  campaign: findCampaignById(placement.campaign_id || placement.campaign_mongo_id),
  zone: findZoneById(placement.zone_id || placement.zone_mongo_id),
  advertisement: findAdvertisementById(placement.advertisement_id),
}));
```

### Sync Integration Patterns
```typescript
// Placement sync with ID resolution
const syncPlacements = async () => {
  const { localPlacements } = useEntityStore();
  const unsyncedPlacements = localPlacements.filter(p => !p.synced_with_api);

  for (const placement of unsyncedPlacements) {
    // Resolve MongoDB IDs to Broadstreet IDs for sync
    const syncData = {
      campaign_id: placement.campaign_id || await resolveCampaignId(placement.campaign_mongo_id),
      zone_id: placement.zone_id || await resolveZoneId(placement.zone_mongo_id),
      advertisement_id: placement.advertisement_id,
      restrictions: placement.restrictions,
    };

    await syncPlacementToBroadstreet(syncData);
  }
};
```

### Local-Only Page Integration
```typescript
// Display local placements with entity information
const LocalPlacementCard = ({ placement }) => {
  const campaign = findCampaignById(placement.campaign_id || placement.campaign_mongo_id);
  const zone = findZoneById(placement.zone_id || placement.zone_mongo_id);
  const advertisement = findAdvertisementById(placement.advertisement_id);

  return (
    <div className="placement-card local-styling">
      <div className="placement-info">
        <div>Campaign: {campaign?.name}
          {placement.campaign_mongo_id && <LocalBadge />}
        </div>
        <div>Zone: {zone?.name}
          {placement.zone_mongo_id && <LocalBadge />}
        </div>
        <div>Advertisement: {advertisement?.name}</div>
      </div>
      <button onClick={() => deletePlacement(placement._id)}>×</button>
    </div>
  );
};
```

### Variable Naming Compliance
Following `docs/variable-origins.md` standards:
- `localPlacements` - Collection of locally created placement entities
- `isLoadingPlacements` - Loading state for placement data fetching operations
- `placementError` - Error state for placement-related operations
- `selectedPlacements` - Array of selected placement IDs for bulk operations

## Business Logic Confirmation
Placements are created from the sidebar > Utilities > Creaete Placements.
the filter has to have network, advertiser, and campaign.
Futher there has to be atleast 1 zone and 1 advertisement selected.
Multiple zones and advertisements can be selected. All combinations of the selected zones and advertisements are created.

When the create placemetns button is clicked, modal shows the info of what is going to happen.

### **NEW FEATURE**
**TWO MODES** there will be to choice of two modes.
The sidebar > Utilties section will get a toggle button. it will toggle between safe mode and advanced mode. Advanced mode denoted by a red background and safe mode by a green background. Ensure font is bold and black.

we know the all all zones and advertisements have a SQ, LS or PT as standalone words IN CAPITAL
SQ - stands for square (ad sizes 350x200)
LS - stands for leaderboard (ad sizes 728x90)
PT - stands for portrait (ad sizes 300x600)

when the create placement button is pressed and the modal opens, following will happen:
the modal opens. The modal will be depending on the mode selected.

#### Safe Mode - Mode 1 - the default mode
Safe mode will do this - it will only allow combos of advertisements and zones that have the same size type. Everything else will be ignore.

#### Advanced Mode - Mode 2 - the second mode
Advanced mode will do this - it will allow all combinations of advertisements and zones, which is the current default.
