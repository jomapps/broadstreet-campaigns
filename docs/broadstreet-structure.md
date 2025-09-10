# Broadstreet Structure

## Data Architecture Overview

The Broadstreet Campaigns application follows a hierarchical data structure where:
- **Broadstreet API** is the source of truth
- **Local MongoDB** serves as a cache for performance
- Data is synchronized using a "clear and replace" strategy

## Entity Relationships

```
Networks (1) ──→ (many) Zones
Networks (1) ──→ (many) Advertisers
Advertisers (1) ──→ (many) Campaigns
Campaigns (1) ──→ (many) Placements [embedded]
Advertisements (1) ──→ (many) Placements [referenced]
Zones (1) ──→ (many) Placements [referenced]
```

## Networks
Networks are different websites where the campaigns are run. 
In our case we have the main website aka Schwulissimo.de and the other one is TravelM.de
By default we work on the Schwulissimo.de network.

**Key Properties:**
- `id`: Unique network identifier
- `name`: Human-readable network name
- `group_id`: Network group identifier
- `web_home_url`: Network homepage URL
- `logo`: Network logo URL
- `valet_active`: Whether valet service is active
- `path`: Network path
- `advertiser_count`: Number of advertisers in this network
- `zone_count`: Number of zones in this network

## Zones
Zones represent possible placement locations on a website. They can contain size information but we leave everything empty.
Each zone has a name for human readability.
Zones are also called placements in some contexts.

**Key Properties:**
- `id`: Unique zone identifier
- `name`: Human-readable zone name
- `alias`: Zone alias
- `size_type`: Type of size (e.g., "banner", "rectangle")
- `size_number`: Size dimensions
- `network_id`: Reference to the parent network

## Advertisers
Advertisers are the companies that run the campaigns.
Each advertiser has a name and a unique id.
The id is used to identify the advertiser in the API.
The name is used for human readability.

**Key Properties:**
- `id`: Unique advertiser identifier
- `name`: Advertiser company name
- `network_id`: Reference to the parent network

## Advertisements
Advertisements are the actual ads that are shown on the website.
Each advertisement has a name and a unique id.
The id is used to identify the advertisement in the API.
The name is used for human readability.
Each advertisement has a type.
The type can be image, text, video or native.
The advertisement also has the info of the URL where the ad will link to.

**Key Properties:**
- `id`: Unique advertisement identifier
- `name`: Advertisement name
- `type`: Advertisement type (image, text, video, native)
- `preview_url`: URL to preview the advertisement
- `active_placement`: Whether the advertisement is actively placed

## Campaigns
Campaigns are a grouping of:
1) An advertiser
2) One or more combinations of advertisements and zones (stored as placements)
3) Start date
4) End date (optional)
5) Campaign settings (weight, display type, etc.)

**Key Properties:**
- `id`: Unique campaign identifier
- `name`: Campaign name
- `advertiser_id`: Reference to the parent advertiser
- `start_date`: Campaign start date
- `end_date`: Campaign end date (optional)
- `active`: Whether the campaign is active
- `weight`: Campaign weight
- `display_type`: How the campaign is displayed
- `pacing_type`: Campaign pacing type ('asap' or 'even')
- `impression_max_type`: Impression limit type ('cap' or 'goal')
- `paused`: Whether the campaign is paused
- `notes`: Campaign notes
- `archived`: Whether the campaign is archived
- **`placements`**: Array of embedded placement objects (see below)

## Placements (Embedded in Campaigns)
Placements define the relationship between advertisements and zones within a campaign.
They are embedded directly within Campaign documents rather than stored separately.

**Key Properties:**
- `advertisement_id`: Reference to the advertisement
- `zone_id`: Reference to the zone where the ad will be displayed
- `restrictions`: Array of placement restrictions (optional)

**Data Structure:**
```javascript
// Embedded in Campaign document
placements: [
  {
    advertisement_id: 12345,
    zone_id: 67890,
    restrictions: ["mobile_only", "desktop_only"] // or empty array []
  }
]
```

## Data Synchronization

### Sync Strategy
- **Source of Truth**: Broadstreet API
- **Local Storage**: MongoDB (cache)
- **Sync Pattern**: Clear and replace for all entities
- **Placements**: Embedded in campaigns, cleared and updated per campaign

### Sync Process
1. **Clear Phase**: Remove all existing data for the entity type
2. **Fetch Phase**: Retrieve data from Broadstreet API
3. **Store Phase**: Insert/update data in local MongoDB
4. **Placements**: Special handling - embedded in campaigns, cleared via `$unset`, then updated per campaign

### API Endpoints
- `/api/sync/networks` - Sync network data
- `/api/sync/advertisers` - Sync advertiser data  
- `/api/sync/zones` - Sync zone data
- `/api/sync/campaigns` - Sync campaign data
- `/api/sync/advertisements` - Sync advertisement data
- `/api/sync/placements` - Sync placement data (embedded in campaigns)
- `/api/sync/all` - Sync all data types

## Filtering System
The application supports hierarchical filtering:
1. **Network** → Filters advertisers, zones, campaigns, and placements
2. **Advertiser** → Filters campaigns and placements
3. **Campaign** → Filters placements

This filtering is implemented through the `FilterContext` and applied across all data views.




