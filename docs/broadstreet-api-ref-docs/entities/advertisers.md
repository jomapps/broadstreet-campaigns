# Advertisers

**Description**: Companies or clients that place advertisements within a network.

## Operations

### List All Advertisers
**Endpoint**: `GET /advertisers`
**Auth**: API Key required
**Query Parameters**: 
- `network_id` (integer, required) - The network to get advertisers from

```bash
curl "https://api.broadstreetads.com/v1/advertisers?network_id=1&api_key=YOUR_API_KEY"
```

**Response (200)**:
```json
{
  "advertisers": [
    {
      "id": "1",
      "name": "Test Advertiser",
      "logo": {},
      "notes": null,
      "admins": [
        {
          "name": "Front Desk",
          "email": "frontdesk@broadstreeetads.com"
        }
      ]
    }
  ]
}
```

### Create Advertiser
**Endpoint**: `POST /advertisers`
**Auth**: API Key required
**Query Parameters**: 
- `network_id` (integer, required) - The network this advertiser belongs to

**Request Body**:
```json
{
  "name": "Mock Advertiser",
  "web_home_url": "https://mockadvertiser.com/",
  "notes": "They will want to renew but need to be reached out here @ email@example.com"
}
```

**Response (201)**:
```json
{
  "advertiser": {
    "id": "1",
    "name": "Test Advertiser",
    "logo": {},
    "notes": null,
    "admins": [
      {
        "name": "Front Desk",
        "email": "frontdesk@broadstreeetads.com"
      }
    ]
  }
}
```

### Show Single Advertiser
**Endpoint**: `GET /advertisers/{id}`
**Auth**: API Key required
**Path Parameters**: 
- `id` (integer, required) - Advertiser identifier

**Response (200)**:
```json
{
  "advertiser": {
    "id": "1",
    "name": "Test Advertiser",
    "logo": {},
    "notes": null,
    "admins": [
      {
        "name": "Front Desk",
        "email": "frontdesk@broadstreeetads.com"
      }
    ]
  }
}
```

**Response (404)**: Advertiser not found

### Update Advertiser
**Endpoint**: `PUT /advertisers/{id}`
**Auth**: API Key required
**Path Parameters**: 
- `id` (integer, required) - Advertiser identifier

**Request Body** (all optional):
```json
{
  "name": "Updated Advertiser Name",
  "web_home_url": "https://mockadvertiser.com/",
  "notes": "Updated notes about renewal"
}
```

**Response (200)**:
```json
{
  "advertiser": {
    "id": "1",
    "name": "Updated Advertiser Name",
    "logo": {},
    "notes": "Updated notes about renewal",
    "admins": [
      {
        "name": "Front Desk",
        "email": "frontdesk@broadstreeetads.com"
      }
    ]
  }
}
```

### Delete Advertiser
**Endpoint**: `DELETE /advertisers/{id}`
**Auth**: API Key required
**Path Parameters**: 
- `id` (integer, required) - Advertiser identifier

**Response**: No content (successful deletion)

## Entity Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique advertiser identifier |
| `name` | string | Advertiser display name |
| `logo` | object | Logo configuration |
| `notes` | string/null | Internal notes about the advertiser |
| `admins` | array | List of admin users with access |
| `web_home_url` | string | Advertiser's website URL |

## Admin Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Admin user's name |
| `email` | string | Admin user's email |

## Common Patterns

### Advertiser Hierarchy
```
Network
└── Advertiser
    ├── Campaigns
    └── Advertisements
```

### Notes Field Usage
The `notes` field is commonly used for:
- Renewal information
- Contact details
- Account status
- Special instructions

### Typical Workflow
1. Select Network
2. Create Advertiser
3. Add Advertiser Admins (optional)
4. Create Advertisements
5. Create Campaigns
6. Create Placements

## Related Entities
- [Networks](./networks.md) - Parent entity
- [Campaigns](./campaigns.md) - Child entities
- [Advertisements](./advertisements.md) - Child entities
- [Advertiser Admins](./advertiser-admins.md) - Access management