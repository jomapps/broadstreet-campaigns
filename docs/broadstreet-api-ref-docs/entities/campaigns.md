# Campaigns

**Description**: Time-bound advertising campaigns that group advertisements with targeting and delivery settings.

## Operations

### List All Campaigns
**Endpoint**: `GET /campaigns`
**Auth**: API Key required
**Query Parameters** (one required): 
- `advertiser_id` (integer) - Get campaigns for specific advertiser
- `zone_id` (integer) - Get campaigns for specific zone
- **Note**: Cannot use both parameters simultaneously

```bash
# Get campaigns by advertiser
curl "https://api.broadstreetads.com/v1/campaigns?advertiser_id=1&api_key=YOUR_API_KEY"

# Get campaigns by zone
curl "https://api.broadstreetads.com/v1/campaigns?zone_id=1&api_key=YOUR_API_KEY"
```

**Response (200)**:
```json
{
  "campaigns": [
    {
      "id": 1,
      "name": "Campaign 1",
      "advertiser_id": 2,
      "start_date": "2022-01-01",
      "end_date": "2022-01-31",
      "max_impression_count": 10000,
      "display_type": "no_repeat",
      "active": false,
      "weight": "1",
      "path": "/networks/2/advertisers/2/campaigns/1"
    }
  ]
}
```

### Create Campaign
**Endpoint**: `POST /campaigns`
**Auth**: API Key required
**Query Parameters**: 
- `advertiser_id` (integer, required) - The advertiser this campaign belongs to

**Request Body**:
```json
{
  "name": "Campaign 1",
  "start_date": "2022-01-01",
  "end_date": "2022-01-31",
  "max_impression_count": 10000,
  "archived": true,
  "display_type": "no_repeat",
  "pacing_type": "asap",
  "impression_max_type": "cap",
  "paused": false,
  "weight": "1",
  "notes": "This is a campaign for the homepage, geo targeted until the 31st."
}
```

**Response (201)**:
```json
{
  "campaign": {
    "id": 1,
    "name": "Campaign 1",
    "advertiser_id": 2,
    "start_date": "2022-01-01",
    "end_date": "2022-01-31",
    "max_impression_count": 10000,
    "display_type": "no_repeat",
    "active": false,
    "weight": "1",
    "path": "/networks/2/advertisers/2/campaigns/1"
  }
}
```

### Show Single Campaign
**Endpoint**: `GET /campaigns/{id}`
**Auth**: API Key required
**Path Parameters**: 
- `id` (integer, required) - Campaign identifier

**Response (200)**:
```json
{
  "id": 1,
  "name": "Campaign 1",
  "advertiser_id": 2,
  "start_date": "2022-01-01",
  "end_date": "2022-01-31",
  "max_impression_count": 10000,
  "display_type": "no_repeat",
  "active": false,
  "weight": "1",
  "path": "/networks/2/advertisers/2/campaigns/1"
}
```

### Update Campaign
**Endpoint**: `PUT /campaigns/{id}`
**Auth**: API Key required
**Path Parameters**: 
- `id` (integer, required) - Campaign identifier

**Request Body** (all optional):
```json
{
  "name": null,
  "start_date": "2022-01-01",
  "end_date": "2022-01-31",
  "max_impression_count": 10000,
  "archived": true,
  "display_type": "no_repeat",
  "pacing_type": "asap",
  "impression_max_type": "cap",
  "paused": false,
  "weight": "1",
  "notes": "Updated campaign notes"
}
```

**Response (200)**:
```json
{
  "id": 1,
  "name": "Campaign 1",
  "advertiser_id": 2,
  "start_date": "2022-01-01",
  "end_date": "2022-01-31",
  "max_impression_count": 10000,
  "display_type": "no_repeat",
  "active": false,
  "weight": "1",
  "path": "/networks/2/advertisers/2/campaigns/1"
}
```

### Delete Campaign
**Endpoint**: `DELETE /campaigns/{id}`
**Auth**: API Key required
**Path Parameters**: 
- `id` (integer, required) - Campaign identifier

**Response**: No content (successful deletion)

## Entity Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | integer | Unique campaign identifier |
| `name` | string | Campaign display name |
| `advertiser_id` | integer | Parent advertiser ID |
| `start_date` | date | Campaign start date (YYYY-MM-DD) |
| `end_date` | date | Campaign end date (YYYY-MM-DD) |
| `max_impression_count` | integer | Maximum impressions target |
| `display_type` | string | Repeat behavior setting |
| `active` | boolean | Current active status |
| `weight` | string/integer | Campaign priority weight |
| `path` | string | API path reference |
| `archived` | boolean | Archive status |
| `pacing_type` | string | Impression delivery pacing |
| `impression_max_type` | string | Hard cap vs. goal setting |
| `paused` | boolean | Pause status |
| `notes` | string | Campaign notes |

## Enum Values

### Display Type Options
- `no_repeat` - Cannot repeat on same page
- `allow_repeat_campaign` - Allow campaign repetition
- `allow_repeat_advertisement` - Allow ad repetition
- `force_repeat_campaign` - Force campaign repetition

### Pacing Type Options
- `asap` - Deliver impressions as soon as possible
- `even` - Distribute impressions evenly over time period

### Impression Max Type Options
- `cap` - Hard limit (campaign deactivates when exceeded)
- `goal` - Soft limit (allows overdelivery)

### Weight Values
- `0` or `"remnant"` - Remnant priority
- `0.5` or `"low"` - Low priority
- `1` or `"default"` - Default priority
- `1.5` or `"high"` - High priority
- `127` or `"sponsorship"` - Sponsorship priority

## Common Patterns

### Campaign Lifecycle
1. **Setup**: Create campaign with dates and targeting
2. **Placement**: Create placements to assign ads to zones
3. **Activation**: Campaign goes live based on start_date
4. **Monitoring**: Track via reporting endpoints
5. **Completion**: Campaign ends based on end_date or impression cap

### Date Handling
- Dates must be in `YYYY-MM-DD` format
- Start date should be today or future
- End date must be after start date
- Campaigns with past end dates may still be "active" but won't serve

### Weight-Based Delivery
Higher weight campaigns get priority:
- Sponsorship (127) > High (1.5) > Default (1) > Low (0.5) > Remnant (0)
- Use for guaranteed vs. remnant inventory

## Related Entities
- [Advertisers](./advertisers.md) - Parent entity
- [Placements](./placements.md) - Campaign-to-zone assignments
- [Advertisements](./advertisements.md) - Creative content
- [Reporting](./reporting.md) - Performance analytics