# Zones

**Description**: Ad placement locations within a network where advertisements can be displayed.

## Operations

### List All Zones
**Endpoint**: `GET /zones`
**Auth**: API Key required
**Query Parameters**: 
- `network_id` (integer, required) - The network to get zones from

```bash
curl "https://api.broadstreetads.com/v1/zones?network_id=1&api_key=YOUR_API_KEY"
```

**Response (200)**:
```json
{
  "zones": [
    {
      "id": 1,
      "name": "Zone 1",
      "network_id": 2,
      "alias": null,
      "self_serve": false
    }
  ]
}
```

### Create Zone
**Endpoint**: `POST /zones`
**Auth**: API Key required
**Query Parameters**: 
- `network_id` (integer, required) - The network to create the zone in

**Request Body**:
```json
{
  "name": "Leaderboard Zone",
  "alias": "zone-alias-1"
}
```

**Response (201)**:
```json
{
  "zone": {
    "id": 1,
    "name": "Leaderboard Zone",
    "network_id": 2,
    "alias": "zone-alias-1",
    "self_serve": false
  }
}
```

### Show Single Zone
**Endpoint**: `GET /zones/{id}`
**Auth**: API Key required
**Path Parameters**: 
- `id` (integer, required) - Zone identifier

**Response (200)**:
```json
{
  "id": 1,
  "name": "Zone 1",
  "network_id": 2,
  "alias": null,
  "self_serve": false
}
```

### Update Zone
**Endpoint**: `PUT /zones/{id}`
**Auth**: API Key required
**Path Parameters**: 
- `id` (integer, required) - Zone identifier

**Request Body**:
```json
{
  "name": "Updated Zone Name",
  "alias": "new-zone-alias"
}
```

**Response (200)**:
```json
{
  "id": 1,
  "name": "Updated Zone Name",
  "network_id": 2,
  "alias": "new-zone-alias",
  "self_serve": false
}
```

### Delete Zone
**Endpoint**: `DELETE /zones/{id}`
**Auth**: API Key required
**Path Parameters**: 
- `id` (integer, required) - Zone identifier

**Response**: No content (successful deletion)

## Entity Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | integer | Unique zone identifier |
| `name` | string | Zone display name |
| `network_id` | integer | Parent network ID |
| `alias` | string/null | Alternative identifier |
| `self_serve` | boolean | Self-service availability |

## Common Patterns

### Zone Naming Conventions
Zones typically represent specific ad placements:
- **By Location**: "Header Banner", "Sidebar", "Footer"
- **By Format**: "Leaderboard 728x90", "Rectangle 300x250"
- **By Page**: "Homepage Hero", "Article Inline", "Search Results"
- **By Device**: "Mobile Banner", "Desktop Sidebar"

### Alias Usage
Aliases provide developer-friendly identifiers:
```json
{
  "name": "Homepage Leaderboard",
  "alias": "home-leader"
}
```

Benefits:
- More readable in code: `zone-alias-1` vs `zone_id=42`
- Stable across environments
- Easier to remember and document

### Zone Hierarchy
```
Network
└── Zone (Ad Placement Location)
    └── Placements (Campaign + Advertisement assignments)
```

### Typical Workflow
1. **Planning**: Identify ad placement locations
2. **Creation**: Create zones for each placement
3. **Integration**: Add zones to website/app via embed codes
4. **Placement**: Assign campaigns and ads to zones
5. **Optimization**: Monitor performance and adjust

### Self-Serve Zones
The `self_serve` flag indicates if advertisers can:
- Directly place ads in this zone
- Access zone analytics
- Manage their own placements

## Zone Integration

### Embed Code Pattern
After creating a zone, you'll typically integrate it like:
```html
<!-- Zone: Homepage Leaderboard (ID: 123) -->
<script type="text/javascript" src="https://ad.broadstreetads.com/zone/123.js"></script>
```

### Dynamic Zone Loading
For programmatic integration:
```javascript
// Load zone by ID
loadBroadstreetZone(123);

// Load zone by alias
loadBroadstreetZone('home-leader');
```

## Related Entities
- [Networks](./networks.md) - Parent entity
- [Placements](./placements.md) - Campaign-to-zone assignments
- [Campaigns](./campaigns.md) - Can filter by zone
- [Advertisements](./advertisements.md) - Can filter by zone