500631# Campaigns

## Overview

Campaigns represent advertising campaigns that run on a network. Each campaign belongs to a single network and a single advertiser. Campaigns are fully integrated with the **Zustand store architecture** for advanced functionality including copy-to-theme, delete operations, and status filtering.

## ID Management

Campaigns follow the standardized three-tier ID system:
- **`broadstreet_id`**: Broadstreet API identifier (number) - for synced campaigns
- **`mongo_id`**: MongoDB ObjectId (string) - for local storage and local-only campaigns
- **`_id`**: MongoDB native ObjectId - for internal database operations only

## Zustand Store Integration

### Store Location
- **Synced Campaigns**: `EntityState.campaigns` array (have `broadstreet_id`)
- **Local Campaigns**: `EntityState.localCampaigns` array (local-only, no `broadstreet_id` yet)

### Selection Management
- **Filter State**: `FilterState.selectedCampaign` (can be synced or local)
- **Placement Management**: Complex relationships with creation modal integration
- **Advanced Functionality**: Copy-to-theme, delete operations, status filtering

### Server-Side Integration
```typescript
// Server-side data fetching with parameters
const campaigns = await fetchCampaigns({ networkId, advertiserId });

// Client-side store initialization
const { setCampaigns, setLocalCampaigns } = useEntityStore();
useEffect(() => {
  setCampaigns(campaigns.filter(c => c.name && (c.broadstreet_id || c.mongo_id)));
}, [campaigns]);
```

## Parents relationship
Campaigns are children of advertisers and networks.
Campaigns are parents of placements (combinations of advertisements and zones).



**CRITICAL**
- if a value is not required and it is not provided, it will not be included in the request body.
- other than the id, we never rely on another id.
- when we open a campaign creation form, we DO NOT have a campaign id. We also dont give it any. We do that only on save.
- fields required by the broadstreet api that are required need to present. They are almost always in the filters section of the sidebar. e.g. network id and advertiser id are required. If not present, give message.
- in campaign duplicate names are allowed.


## How to create a campaign

Use the Broadstreet API to create a campaign for a specific advertiser.

- Required:
  - `access_token` (query) – found in your environment
  - `name` (body, required)
  - `advertiser_id` (body, required) – the Broadstreet advertiser to attach the campaign to
- Endpoint: `POST https://api.broadstreetads.com/api/1/campaigns`
- Headers: `Content-Type: application/json`
- Query params:
  - `access_token` (string, required)
- Request body (JSON):
  - `name` (string, required)
  - `advertiser_id` (number, required)
  - Optional: `start_date` (YYYY-MM-DD), `end_date` (YYYY-MM-DD), `max_impression_count` (number), `display_type` (`no_repeat` | `allow_repeat_campaign` | `allow_repeat_advertisement` | `force_repeat_campaign`), `active` (boolean), `weight` (number), `path` (string), `archived` (boolean), `pacing_type` (`asap` | `even`), `impression_max_type` (`cap` | `goal`), `paused` (boolean), `notes` (string)

Example cURL
```bash
curl -X POST \
  "https://api.broadstreetads.com/api/1/campaigns?access_token=$BROADSTREET_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Fall Promo",
    "advertiser_id": 12345,
    "start_date": "2025-10-01",
    "weight": 100,
    "pacing_type": "asap"
  }'
```

Example response (201 Created)
```json
{
  "campaign": {
    "id": 67890,
    "name": "Fall Promo",
    "advertiser_id": 12345,
    "start_date": "2025-10-01",
    "end_date": null,
    "weight": 100,
    "display_type": "no_repeat",
    "active": true,
    "path": "",
    "archived": false,
    "pacing_type": "asap",
    "impression_max_type": "cap",
    "paused": false,
    "notes": ""
  }
}
```

TypeScript example (using our API helper)
```ts
import broadstreetAPI from '@/lib/broadstreet-api';

const created = await broadstreetAPI.createCampaign({
  name: 'Fall Promo',
  advertiser_id: 12345,
  start_date: '2025-10-01',
  weight: 100,
  pacing_type: 'asap',
});

// created => { broadstreet_id, name, advertiser_id, start_date, ... }
```

Create locally (in-app, recommended during testing)
- Open the Campaigns page and click the “Create” button → choose Campaign to open the Add Campaign modal.
- The modal requires both a network and an advertiser selected in the sidebar; it uses those selections to set `networkId` and `advertiserId`.
- On submit, it calls our local endpoint `POST /api/create/campaign` and stores the campaign as unsynced (`created_locally: true`, `synced_with_api: false`).

Local endpoint example
```bash
curl -X POST http://localhost:3000/api/create/campaign \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Fall Promo",
    "networkId": 85,
    "advertiserId": 12345,
    "startDate": "2025-10-01",
    "weight": 100,
    "displayType": "no_repeat",
    "pacingType": "asap"
  }'
```

Local endpoint example (with a LOCAL advertiser)
```bash
curl -X POST http://localhost:3000/api/create/campaign \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Fall Promo",
    "networkId": 85,
    "advertiser": { "mongoId": "68c87564d49cd5ae18663ccf" },
    "startDate": "2025-10-01",
    "weight": 100,
    "pacingType": "asap"
  }'
```

Notes about local advertisers
- The creation endpoint accepts either `advertiser_id` (number) or `advertiser` object with `broadstreet_id` or `mongo_id`.
- If the advertiser is local, pass `advertiser.mongo_id`. We store `advertiser_id` internally as that string until sync.
- The campaigns list endpoint `GET /api/campaigns?advertiser_id=...` accepts a numeric Broadstreet ID or a MongoDB ObjectId string and filters accordingly.

What you should see after creating locally
- Campaigns page: the new campaign card shows a "🏠 Local" badge and uses local card styling.
- Local Only page: the campaign appears under “Campaigns” with a "Local Only" status badge, ready to sync.
- Data flags: item is saved with `created_locally: true` and `synced_with_api: false` until synced.

Add Campaign modal data mapping
- Required: `name`, a selected network (`network_id` from sidebar), a selected advertiser (`advertiser_id` or `advertiser.mongo_id` from sidebar), `start_date`, and `weight`.
- Optional fields sent only if provided: `end_date`, `max_impression_count`, `display_type` (defaults to `no_repeat`), `pacing_type` (defaults to `asap`), `archived`, `paused`, `notes`.

Notes
- Pass `access_token` in the query string; the API expects it there.
- A 401 indicates an invalid or missing token. Ensure `BROADSTREET_API_TOKEN` is set.
- Dates are normalized to `YYYY-MM-DD` when syncing to Broadstreet.
- Name uniqueness is not enforced globally; check per-advertiser duplicates as needed.

Reference: [Broadstreet Campaigns API v1](https://api.broadstreetads.com/docs/v1#tag/Campaigns)

## Sync a local campaign to Broadstreet

In-app steps
- Go to Local Only → Campaigns section.
- Click “Sync All to Broadstreet” to sync all local entities for the selected network. Campaigns will be synced after advertisers and zones.
- Alternatively, from the Campaigns page ensure your network and advertiser are selected, then run a sync from the Local Only page.

API (sync all local entities for a network)
```bash
curl -X POST http://localhost:3000/api/sync/local-all \
  -H "Content-Type: application/json" \
  -d '{
    "networkId": 85
  }'
```

What happens
- A dry run validates duplicates and dependencies.
- If valid, the service creates missing entities in Broadstreet. For campaigns, it sends `name`, `advertiser_id`, and optional fields like `start_date`, `weight`, `pacing_type`, etc., when present.
- On success, the local campaign is updated with `broadstreet_id`, `synced_with_api: true`, and `synced_at`.

## How to update a campaign

## Pre-requisites
- access token - found in the .env file
- advertiser id
  - In-app creation: comes from the advertiser you select in the sidebar; the Add Campaign modal reads it automatically.
  - API usage: the numeric Broadstreet `advertiser_id`. Obtain by listing advertisers or from stored advertisers where `Advertiser.id` equals the Broadstreet ID.

**CRITICAL**
- if a value is not required and it is not provided, it will not be included in the request body.
- other than the id, we never rely on another id.
- when we open a campaign creation form, we DO NOT have a campaign id. We also dont give it any. We do that only on save.
- fields required by the broadstreet api that are required need to present. They are almost always in the filters section of the sidebar. e.g. network id and advertiser id are required. If not present, give message.
- in campaign duplicate names are allowed.

**HANDLING LOCAL ADVERTISERS AND CAMPAIGNS**
- we may create local advertisers. they will not have a broadstreet_id, being local. so we just use the mongo_id. later the sync will update the broadstreet_id.

## Implementation Status

### ✅ **COMPLETED - Production Ready**

Campaign sync functionality has been successfully implemented and is fully operational.

#### **Core Features Implemented:**
- ✅ **Local Campaign Creation**: Full support via `src/lib/models/local-campaign.ts`
- ✅ **Broadstreet API Integration**: Complete campaign creation and sync
- ✅ **Dependency Resolution**: Automatic advertiser ID resolution during sync
- ✅ **Embedded Placements**: Support for placements within campaigns
- ✅ **Sync Tracking**: `created_locally`, `synced_with_api`, `synced_at` fields
- ✅ **Error Handling**: Comprehensive error classification and retry logic

#### **API Endpoints Implemented:**
- ✅ `POST /api/sync/campaigns` - Individual campaign sync
- ✅ `POST /api/sync/local-all` - Comprehensive sync including campaigns
- ✅ Campaign creation via Broadstreet API with proper validation

#### **Sync Process:**
- ✅ **Dependency Validation**: Ensures advertiser exists before campaign sync
- ✅ **Duplicate Detection**: Checks for existing campaigns with same name
- ✅ **ID Resolution**: Converts MongoDB ObjectIds to Broadstreet numeric IDs
- ✅ **Placement Migration**: Handles embedded placements during sync

**System Status: ✅ FULLY OPERATIONAL**

## Zustand Store Usage Patterns

### Entity Store Actions
```typescript
// Setting campaigns with validation
const { setCampaigns, setLocalCampaigns } = useEntityStore();

// Synced campaigns (from Broadstreet API)
setCampaigns(campaigns.filter(c => c.name && (c.broadstreet_id || c.mongo_id)));

// Local campaigns (created locally with embedded placements)
setLocalCampaigns(localCampaigns.filter(c => c.name && c.network_id && c.mongo_id));
```

### Filter Store Integration
```typescript
// Campaign selection with dependency management
const { selectedCampaign, setSelectedCampaign, selectedAdvertiser } = useFilterStore();

// Handle campaign selection
const handleCampaignSelect = (campaign: CampaignEntity) => {
  setSelectedCampaign(campaign);
  // Campaign selection doesn't clear other selections
};

// Filter campaigns by advertiser
const filteredCampaigns = campaigns.filter(campaign =>
  !selectedAdvertiser || campaign.advertiser_id === getEntityId(selectedAdvertiser)
);
```

### Advanced Campaign Features
```typescript
// Copy-to-theme functionality
const { setSelectedTheme, setSelectedZones } = useFilterStore();

const copyToTheme = (campaign: CampaignEntity, theme: ThemeEntity) => {
  setSelectedTheme(theme);
  setSelectedZones(theme.zone_ids.map(String)); // Convert to EntitySelectionKey array
};

// Status filtering
const activeCampaigns = campaigns.filter(c => c.active);
const pausedCampaigns = campaigns.filter(c => c.paused);
const archivedCampaigns = campaigns.filter(c => c.archived);
```

### Placement Management Integration
```typescript
// Campaign-placement relationships
const { localPlacements } = useEntityStore();

// Get placements for a campaign
const getCampaignPlacements = (campaign: CampaignEntity) => {
  const campaignId = getEntityId(campaign);
  return localPlacements.filter(placement => {
    if (typeof campaignId === 'number') {
      return placement.campaign_id === campaignId;
    } else {
      return placement.campaign_mongo_id === campaignId;
    }
  });
};
```

### Variable Naming Compliance
Following `docs/variable-origins.md` standards:
- `selectedCampaign` - Currently selected campaign entity in filter state
- `campaigns` - Collection of all synced campaign entities from API/database
- `localCampaigns` - Collection of locally created campaign entities
- `isLoadingCampaigns` - Loading state for campaign data fetching operations
- `campaignError` - Error state for campaign-related operations

## Business Logic Confirmation ***
network id i srequired as in all cases we need to know the network id.

### No advertiser in filter
please show all campaigns for all advertisers.

### Advertiser in filter
please show all campaigns for the selected advertiser.
all campaigns have a active filed in the database. it set to true or false
we translate that to a tag : paused or running
Split the display in two groups: paused and running.
Please make sure that the running campaigns are shown first.
