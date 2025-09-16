# Placement

## Overview

Placements represent combinations of advertisements and zones. Each placement belongs to a single campaign.

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
- we may create local advertisers. they will not have an id, being local. so we just use the mongodb _id. later the sync will update the id.
- we may create local campaigns. they will not have an id, being local. so we just use the mongodb _id. later the sync will update the id.

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
- **During sync/upload**: Local MongoDB IDs are resolved to Broadstreet numeric IDs
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