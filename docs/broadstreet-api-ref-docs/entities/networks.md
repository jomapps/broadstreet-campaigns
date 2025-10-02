# Networks

**Description**: Top-level organization containers that hold advertisers and zones.

## Operations

### List All Networks
**Endpoint**: `GET /networks`
**Auth**: API Key required
**Parameters**: None

```bash
curl "https://api.broadstreetads.com/v1/networks?api_key=YOUR_API_KEY"
```

**Response (200)**:
```json
{
  "networks": [
    {
      "id": "1",
      "name": "Publishing Today",
      "group_id": null,
      "logo": {},
      "valet_active": false,
      "path": "/networks/1"
    }
  ]
}
```

### Create Network
**Endpoint**: `POST /networks`
**Auth**: API Key required

**Request Body**:
```json
{
  "name": "Test Network Name",
  "logo": "https://img.url.com",
  "web_home_url": "www.example.com"
}
```

**Response (201)**:
```json
{
  "network": {
    "id": "1",
    "name": "Publishing Today",
    "group_id": null,
    "logo": {},
    "valet_active": false,
    "path": "/networks/1"
  }
}
```

### Show Single Network
**Endpoint**: `GET /networks/{id}`
**Auth**: API Key required
**Path Parameters**: 
- `id` (integer, required) - Network identifier

**Response (200)**:
```json
{
  "network": {
    "id": "1",
    "name": "Publishing Today",
    "group_id": null,
    "logo": {},
    "valet_active": false,
    "path": "/networks/1",
    "advertiser_count": 10,
    "zone_count": 3
  }
}
```

**Response (404)**: Network not found

### Update Network
**Endpoint**: `PUT /networks/{id}`
**Auth**: API Key required
**Path Parameters**: 
- `id` (integer, required) - Network identifier

**Request Body** (all optional):
```json
{
  "name": "Updated Network Name",
  "logo": "https://img.url.com",
  "web_home_url": "www.example.com"
}
```

**Response (200)**:
```json
{
  "network": {
    "id": "1",
    "name": "Updated Network Name",
    "group_id": null,
    "logo": {},
    "valet_active": false,
    "path": "/networks/1"
  }
}
```

### Get Network Highlights
**Endpoint**: `GET /networks/{id}/highlights`
**Auth**: API Key required
**Path Parameters**: 
- `id` (integer, required) - Network identifier

**Response (200)**:
```json
{
  "data": {
    "advertisers_created": 10,
    "advertisements_created": 15,
    "avg_ctr": 2.28,
    "highest_ctr": {
      "ctr": 2.04,
      "ad": "{ AD OBJECT }"
    }
  }
}
```

## Entity Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique network identifier |
| `name` | string | Network display name |
| `group_id` | string/null | Parent group identifier |
| `logo` | object | Logo configuration |
| `valet_active` | boolean | Valet service status |
| `path` | string | API path reference |
| `advertiser_count` | integer | Number of advertisers (show only) |
| `zone_count` | integer | Number of zones (show only) |
| `web_home_url` | string | Network website URL |

## Common Patterns

### Network as Root Entity
Networks serve as the root container for all other entities:
- All advertisers belong to a network
- All zones belong to a network
- Most API calls require a `network_id` parameter

### Typical Workflow
1. Create/Select Network
2. Create Zones within Network  
3. Create Advertisers within Network
4. Proceed with campaign creation

## Related Entities
- [Advertisers](./advertisers.md) - Child entities
- [Zones](./zones.md) - Child entities  
- [Network Admins](./network-admins.md) - Access management