# Placement Logic

## Overview
Placements are advertisements that are displayed on a zone for a particular campaign.

## Advertiser
A campaign can have only a single advertiser. Selecting the campaign implicitly sets the advertiser context. This is informational only. HOWEVER it is required to be set via the sidebar filters so that we can choose the correct campaign.

## Campaign
We are required to choose the correct campaign for the placements to be created.

## Zone
We are required to choose the zones where we would like to display the advertisements.

## Advertisement
Advertisement is the ad that we would like to display.
Advertisements are unique to the advertiser.

## What
The Create Placements button will be enabled only if we have selected campaign, zone(s) and advertisement(s).

## where
A button in the sidebar > Utilities section > "Create Placements" triggers placement creation. The tagline reads: "Requires: Campaign, Zones, Advertisement".

## Execution
Cards are rendered in the placements page. Data is locally enriched with related advertisement, zone, campaign, advertiser, and network where available.

## Note
Since advertisements cannot be created in this app, they must exist from a prior sync. We can, however, create local placements to be synced later.

## Placement creation logic
Placements are created by the following logic:
- the advertiser of the campaign needs to be present in broadstreet. if not, he will be created first.
- a campaign needs to be present in broadstreet
- if the campaign is still local, we will need to create it first.
- we will be placing all the advertisements selected for all the zones selected
- placement creation can be submitted in bulk; the app will expand all combinations (advertisements × zones) for the selected campaign and create missing items locally in one request.

## Broadstreet Docs
- api formats are in /docs/api-specs.json
- Broadstreet docs are in /docs/broadstreet-structure.md

## Test
Test data:
- network id: 9396
- advertiser id: 199901
- campaign id: 842383
- advertisement id: 1143797

Create placements using the local API so that you can test the creation flow end-to-end without calling Broadstreet directly. See Local API Testing below.

## Note
- no fallbacks
- no mockdata
- no hardcoded ids
- when creating, if the field has no data, we dont include it in the creation 
- networkds and advertisements are NEVER created. They simply exist. We create them manuall in backend.
- remember, this app works as follows:
-- all data is local
-- it interacts with broadstreet api only for sync operations - upload or download. at no other time are you to acceess broadstreet otherwise.

---

## Current Implementation Details (App)

### UI Behavior
- The only create trigger for placements is in the sidebar Utilities as "Create Placements". The header/display area on the placements page no longer shows a create button. Prerequisites: campaign + at least 1 zone + at least 1 advertisement.
- We do not create Networks or Advertisements in-app. The creation modal for those shows guidance with links that open in a new tab and a reminder to resync after making changes in the Broadstreet back office:
  - Networks: https://my.broadstreetads.com/networks
  - Advertisements (for network 9396): https://my.broadstreetads.com/networks/9396/advertisers

### Local API Endpoints
- GET `/api/placements`
  - Returns `{ success: boolean, placements: PlacementEnriched[] }`.
  - Implementation deduplicates placements across synced and local campaigns, batch-fetches related entities (ads/zones/campaigns/advertisers/networks), and avoids N+1 queries.
  - Optional filters: `network_id`, `advertiser_id`, `campaign_id` (numeric), `campaign_mongo_id` (string, local).

- POST `/api/create/placements`
  - Body accepts either `campaign_id` (numeric) or `campaign_mongo_id` (string) plus `advertisement_ids[]` and `zone_ids[]`.
  - Expands the cartesian product (ads × zones) and inserts missing placements into the selected local campaign. Existing ad+zone pairs are skipped (see Duplicate Behavior).
  - Returns `{ message, created, total }` where `created` is newly inserted count and `total` is total placements after insert.

### ID Handling
- Campaign resolution for creation:
  - Prefer `campaign_mongo_id` derived from `selectedCampaign._id` for locally created campaigns.
  - Fallback to numeric `campaign_id` when `selectedCampaign.id` is numeric.
- `advertisement_ids` and `zone_ids` accept numeric strings; the server normalizes to numbers.

### Duplicate Behavior
- If a placement (ad+zone pair) already exists inside the local campaign, it is not re-inserted. Current behavior does not update the existing placement's `restrictions` when duplicates are submitted.

### Thumbnails
- Placement cards render an ad preview if available. If image loading fails, the UI shows a clear text fallback: "No preview available".

### Performance
- GET `/api/placements` avoids N+1 by batching lookups and using maps for enrichment. Network filtering is applied once via the pre-fetched zone map.

---

## Local API Testing

Use these local cURL examples to validate placement creation without calling Broadstreet directly.

1) Create with numeric campaign_id (synced campaign):

```
curl -X POST http://localhost:3000/api/create/placements \
  -H "Content-Type: application/json" \
  -d '{
    "campaign_id": 842383,
    "advertisement_ids": [1143797],
    "zone_ids": [12345, 67890]
  }'
```

2) Create with campaign_mongo_id (local campaign):

```
curl -X POST http://localhost:3000/api/create/placements \
  -H "Content-Type: application/json" \
  -d '{
    "campaign_mongo_id": "<mongo_id_here>",
    "advertisement_ids": [1143797],
    "zone_ids": [12345]
  }'
```

Response shape:

```
{
  "message": "Placements created",
  "created": 2,
  "total": 10
}
```

---

## Conflicts / Divergences to Resolve

- Placement creation process:
  - Document says: "placement creation happens one by one" supplying a single unit each time.
  - Implementation: single POST accepts arrays; expands combinations (ads × zones) and inserts missing placements in bulk.
  >>> I am ok with batch processing. so make the changes as needed.

- Button location:
  - Document: Sidebar button triggers creation. (Matches.)
  - Implementation: Sidebar only; header/display area does not show a create button. If the doc implies header button exists, that is no longer true.
  >>> Button is correct. Currect stage is ok. pls correct / remove

- Duplicate placement behavior:
  - Document: Not specified.
  - Implementation: Existing ad+zone pairs are skipped; current behavior does NOT update `restrictions` for duplicates.
  >>> A duplication is a combination of campaign, ad and zone. So if a placement already exists, we should not create it again. pls correct / remove

- External creation of Networks and Advertisements:
  - Document: States Networks and Advertisements are never created in-app. (Matches.)
  - Implementation: Creation modal explicitly blocks these and provides links to Broadstreet with a resync reminder.
>>> Current behavior is correct. It pops the modal and asks you to create the network or advertisement in the broadstreet back office. pls correct / remove

- API contract for GET placements:
  - Document: Not specified.
  - Implementation: Returns `{ success, placements }` and performs batch enrichment with network filter applied via zone map.
  >>> The idea is - not to remove local placements until theya confirmed as synced. Please correct /remove /implement

- Image preview fallback:
  - Document: Not specified.
  - Implementation: On image load error, shows a text fallback block instead of a broken image.
  >>> The images are coming from broadstreet. They will always be available. The only ones not available are videos. Dont bother to try and fix this. Simply show the url you get. If it is not a video, it will show. pls correct / remove /implement

---

## Next Steps (Planning)

1) Decide whether to change duplicate behavior (e.g., update `restrictions` when a duplicate ad+zone is posted) or keep current "skip only" logic.
2) If desired, document and/or add server-side validation rules for allowed `restrictions`.
3) Add explicit API reference for placements in `/docs/app-docs/api-reference.md` including request/response examples mirrored here.
4) Confirm whether bulk creation should report per-combination errors for partial failures (currently all-or-skip for existing pairs).
5) Ensure e2e tests cover:
   - Sidebar gating for create button
   - POST creation with `campaign_mongo_id` and `campaign_id`
   - Duplicate skip behavior
   - GET placements enrichment and network filtering
