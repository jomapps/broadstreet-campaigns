# Placements

**Description**: Assignments that connect campaigns, advertisements, and zones with optional device targeting.

## Operations

### List Placements
**Endpoint**: `GET /placements`
**Auth**: API Key required
**Query Parameters**: 
- `campaign_id` (integer, required) - Campaign to get placements for

```bash
curl "https://api.broadstreetads.com/v1/placements?campaign_id=352153&api_key=YOUR_API_KEY"
```

**Response (200)**:
```json
{
  "placement": {
    "advertisement_id": 1,
    "zone_id": 1,
    "restrictions": "Phone"
  }
}
```

### Create Placement
**Endpoint**: `POST /placements`
**Auth**: API Key required

**Request Body**:
```json
{
  "campaign_id": 352153,
  "advertisement_id": 42088,
  "zone_id": 2,
  "restrictions": "phone"
}
```

**Response**: Created placement (no specific response format documented)

### Delete Placement
**Endpoint**: `DELETE /placements`
**Auth**: API Key required
**Query Parameters**: 
- `campaign_id` (integer, required) - Campaign containing the placement
- `advertisement_id` (integer, required) - Advertisement in the placement
- `zone_id` (integer, required) - Zone in the placement

```bash
curl -X DELETE "https://api.broadstreetads.com/v1/placements?campaign_id=2&advertisement_id=420288&zone_id=2&api_key=YOUR_API_KEY"
```

**Response**: No content (successful deletion)

## Entity Properties

| Property | Type | Description |
|----------|------|-------------|
| `campaign_id` | integer | Campaign identifier |
| `advertisement_id` | integer | Advertisement identifier |
| `zone_id` | integer | Zone identifier |
| `restrictions` | string | Device targeting restrictions |

## Device Targeting Restrictions

| Value | Description |
|-------|-------------|
| `"phone"` | Mobile phones only |
| `"non_phone"` | All devices except phones |
| `"tablet"` | Tablets only |
| `"desktop"` | Desktop computers only |
| `"mobile"` | Mobile devices (phones + tablets) |

## Common Patterns

### Placement as Junction Entity
Placements connect three core entities:
```
Campaign ──┐
           ├── Placement ──> Zone
Advertisement ──┘
```

This creates the relationship: "Show this Advertisement in this Zone as part of this Campaign"

### Device Targeting Strategies

#### Mobile-First Strategy
```json
[
  {
    "campaign_id": 100,
    "advertisement_id": 201, // Mobile-optimized creative
    "zone_id": 1,
    "restrictions": "mobile"
  },
  {
    "campaign_id": 100,
    "advertisement_id": 202, // Desktop creative
    "zone_id": 1,
    "restrictions": "desktop"
  }
]
```

#### Phone-Specific Targeting
```json
{
  "campaign_id": 100,
  "advertisement_id": 203, // Phone-specific creative
  "zone_id": 2,
  "restrictions": "phone"
}
```

### Multiple Placements Per Campaign
A single campaign can have multiple placements:
```json
[
  {
    "campaign_id": 100,
    "advertisement_id": 201,
    "zone_id": 1, // Header zone
    "restrictions": null
  },
  {
    "campaign_id": 100,
    "advertisement_id": 202,
    "zone_id": 3, // Sidebar zone  
    "restrictions": "desktop"
  },
  {
    "campaign_id": 100,
    "advertisement_id": 203,
    "zone_id": 4, // Footer zone
    "restrictions": "mobile"
  }
]
```

### Placement Lifecycle
1. **Campaign Setup**: Create campaign with dates/targeting
2. **Creative Preparation**: Upload advertisements
3. **Zone Assignment**: Create placements to assign ads to zones
4. **Device Targeting**: Add restrictions if needed
5. **Activation**: Placements go live based on campaign schedule
6. **Optimization**: Monitor and adjust placements based on performance

### Deletion Considerations
- Deleting a placement removes the ad from the zone
- The campaign, advertisement, and zone remain intact
- Use when you want to stop showing a specific ad in a specific location
- Consider pausing the campaign instead for temporary removal

### Error Handling
Common validation errors:
- **Invalid campaign_id**: Campaign doesn't exist or no access
- **Invalid advertisement_id**: Advertisement doesn't exist or wrong advertiser
- **Invalid zone_id**: Zone doesn't exist or wrong network
- **Invalid restrictions**: Device restriction not in allowed values

## Related Entities
- [Campaigns](./campaigns.md) - Parent scheduling entity
- [Advertisements](./advertisements.md) - Creative content
- [Zones](./zones.md) - Placement locations
- [Networks](./networks.md) - Overall container