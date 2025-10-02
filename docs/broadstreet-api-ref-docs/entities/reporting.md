# Reporting

**Description**: Analytics and performance metrics for campaigns, advertisements, networks, and advertisers.

**⚠️ Rate Limit**: All reporting endpoints are throttled to **2 requests per 5 seconds**.

## Operations

### General Reporting
**Endpoint**: `GET /records`
**Auth**: API Key required
**Query Parameters**: 
- `type` (string, required) - Entity type to report on
- `id` (integer, required) - Entity ID to report on
- `summary` (integer, optional) - Set to 1 for summary totals instead of hourly data
- `start_date` (string, optional) - Start date in YYYY-MM-DD format
- `end_date` (string, optional) - End date in YYYY-MM-DD format (inclusive)

**Entity Types**: `advertiser`, `campaign`, `advertisement`, `network`

```bash
# Hourly data for advertisement
curl "https://api.broadstreetads.com/v1/records?type=advertisement&id=12345&start_date=2022-01-01&end_date=2022-01-31&api_key=YOUR_API_KEY"

# Summary totals for campaign
curl "https://api.broadstreetads.com/v1/records?type=campaign&id=678&summary=1&start_date=2022-01-01&end_date=2022-01-31&api_key=YOUR_API_KEY"
```

**Response (200)**:
```json
{
  "object": {
    "id": 1,
    "name": "Advertisement Name",
    "advertiser_id": 4,
    "advertiser_name": "Advertiser Name"
  },
  "records": [
    {
      "dated": "2022-05-25T22:00:00.000+12:00",
      "advertisement_id": 1,
      "campaign_id": null,
      "zone_id": null,
      "view_count": 1250,
      "hover_count": 108,
      "click_count": 10,
      "conversion_count": 10,
      "advertiser_id": 4
    }
  ],
  "totals": {
    "clicks": 10,
    "views": 1250,
    "hovers": 108,
    "conversions": 10
  }
}
```

### Customized Reporting
**Endpoint**: `GET /records?type=custom`
**Auth**: API Key required
**Query Parameters**: 
- `network_id` (integer, required) - Network to report on
- `select` (string, required) - Comma-separated fields to select
- `group` (string, required) - Comma-separated entities to group by
- `start_date` (string, optional) - Start date in YYYY-MM-DD format  
- `end_date` (string, optional) - End date in YYYY-MM-DD format (inclusive)

```bash
curl "https://api.broadstreetads.com/v1/records?type=custom&network_id=85&select=network.id,network.name,zone.id,zone.name,campaign.id,campaign.name,advertiser.id,advertiser.name,advertisement.id,advertisement.name,count(view),count(mobile_view),count(hover),count(click),count(conversion)&group=campaign,zone,network,advertiser,advertisement&start_date=2024-01-01&end_date=2024-01-31&api_key=YOUR_API_KEY"
```

**Response (200)**:
```json
{
  "records": [
    {
      "advertisement_name": "Advertisement Name",
      "advertisement_id": "12347",
      "count(view)": "234"
    }
  ]
}
```

## Available Fields

### Select Fields
- `network.id`, `network.name`
- `advertiser.id`, `advertiser.name`
- `campaign.id`, `campaign.name`
- `advertisement.id`, `advertisement.name`
- `zone.id`, `zone.name`
- `count(view)` - Total views/impressions
- `count(mobile_view)` - Mobile views
- `count(hover)` - Hover events
- `count(click)` - Click events
- `count(conversion)` - Conversion events

### Group By Options
- `network`
- `advertiser` 
- `campaign`
- `advertisement`
- `zone`

## Response Properties

### General Reporting Response
| Property | Type | Description |
|----------|------|-------------|
| `object` | object | Metadata about the entity being reported on |
| `records` | array | Time-series data points (hourly or summary) |
| `totals` | object | Aggregated totals for the time period |

### Record Properties
| Property | Type | Description |
|----------|------|-------------|
| `dated` | datetime | Timestamp for the data point |
| `advertisement_id` | integer | Advertisement identifier |
| `campaign_id` | integer | Campaign identifier |
| `zone_id` | integer | Zone identifier |
| `view_count` | integer | Number of views/impressions |
| `hover_count` | integer | Number of hover events |
| `click_count` | integer | Number of clicks |
| `conversion_count` | integer | Number of conversions |
| `advertiser_id` | integer | Advertiser identifier |

### Totals Properties
| Property | Type | Description |
|----------|------|-------------|
| `views` | integer | Total views/impressions |
| `hovers` | integer | Total hover events |
| `clicks` | integer | Total clicks |
| `conversions` | integer | Total conversions |

## Common Patterns

### Reporting Hierarchy
Reports can be generated at different levels:
```
Network Level
├── Advertiser Level
│   ├── Campaign Level
│   └── Advertisement Level
└── Zone Level (via custom reports)
```

### Time-Series vs. Summary Data
```bash
# Time-series (hourly data points)
GET /records?type=campaign&id=123&start_date=2024-01-01&end_date=2024-01-07

# Summary (single totals record)
GET /records?type=campaign&id=123&summary=1&start_date=2024-01-01&end_date=2024-01-07
```

### Performance Metrics Calculations
```javascript
// Click-through rate (CTR)
const ctr = (clicks / views) * 100;

// Conversion rate
const conversionRate = (conversions / clicks) * 100;

// Engagement rate (hovers + clicks)
const engagementRate = ((hovers + clicks) / views) * 100;
```

### Date Range Best Practices
- **Default**: Last 30 days if no dates specified
- **Format**: Always use YYYY-MM-DD format
- **Timezone**: Server timezone (typically UTC)
- **Inclusive**: end_date includes the full day

### Rate Limiting Strategy
With only 2 requests per 5 seconds:
```javascript
// Sequential reporting with delays
async function generateReports(entities) {
  const reports = [];
  for (const entity of entities) {
    const report = await fetchReport(entity);
    reports.push(report);
    await delay(2500); // Wait 2.5 seconds between requests
  }
  return reports;
}
```

### Custom Report Examples

#### Performance by Zone
```bash
# Get performance metrics grouped by zone
curl "...&select=zone.id,zone.name,count(view),count(click),count(conversion)&group=zone&..."
```

#### Advertiser Comparison
```bash
# Compare all advertisers in a network
curl "...&select=advertiser.id,advertiser.name,count(view),count(click)&group=advertiser&..."
```

#### Campaign Performance
```bash
# Detailed campaign analysis
curl "...&select=campaign.id,campaign.name,advertisement.name,count(view),count(mobile_view),count(click)&group=campaign,advertisement&..."
```

## Related Entities
- [Networks](./networks.md) - Network-level reporting
- [Advertisers](./advertisers.md) - Advertiser-level reporting
- [Campaigns](./campaigns.md) - Campaign-level reporting
- [Advertisements](./advertisements.md) - Advertisement-level reporting