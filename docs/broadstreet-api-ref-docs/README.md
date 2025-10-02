# Broadstreet API Reference Documentation

A comprehensive offline reference for the Broadstreet Ads API v1, organized for easy pattern recognition and implementation.

## Quick Start

- **Base URL**: `https://api.broadstreetads.com/v1/`
- **Authentication**: API Key (via `api_key` parameter)
- **Content Type**: `application/json`
- **OpenAPI Spec**: [Download](https://api.broadstreetads.com/api-docs/v1/swagger.json)

## Core Entities

| Entity | Description | CRUD Operations | Special Features |
|--------|-------------|-----------------|------------------|
| [Networks](./entities/networks.md) | Top-level organization containers | List, Create, Read, Update | Highlights reporting |
| [Advertisers](./entities/advertisers.md) | Companies/clients placing ads | List, Create, Read, Update, Delete | Admin management |
| [Campaigns](./entities/campaigns.md) | Time-bound ad campaigns | List, Create, Read, Update, Delete | Pacing, weighting, targeting |
| [Advertisements](./entities/advertisements.md) | Individual ad creatives | List, Create | HTML/Static types |
| [Zones](./entities/zones.md) | Ad placement locations | List, Create, Read, Update, Delete | Alias support |
| [Placements](./entities/placements.md) | Campaign-to-Zone assignments | List, Create, Delete | Device targeting |
| [Reporting](./entities/reporting.md) | Analytics and metrics | General, Custom | Throttled (2 req/5s) |

## Admin Management

| Entity | Description | Operations |
|--------|-------------|------------|
| [Network Admins](./entities/network-admins.md) | Network-level user access | Create, Remove |
| [Advertiser Admins](./entities/advertiser-admins.md) | Advertiser-level user access | Create |

## Common Patterns

### Hierarchical Structure
```
Network
├── Advertisers
│   ├── Campaigns
│   │   └── Placements (Advertisement + Zone)
│   └── Advertisements
└── Zones
```

### Standard Parameters
- **network_id**: Required for most operations
- **id**: Entity identifier for specific operations
- **start_date/end_date**: ISO 8601 format (YYYY-MM-DD)
- **active/archived/paused**: Boolean status flags

### Response Structure
All responses follow consistent patterns:
- Single entity: `{"entity_name": {...}}`
- Multiple entities: `{"entity_names": [...]}`
- Errors: Standard HTTP status codes with JSON messages

### Rate Limits
- **Reporting endpoints**: 2 requests per 5 seconds
- **Other endpoints**: No specified limits

## Quick Reference

### Authentication
```bash
# All requests require api_key parameter
curl "https://api.broadstreetads.com/v1/networks?api_key=YOUR_API_KEY"
```

### Common Workflows

1. **Setup**: Network → Advertisers → Zones
2. **Campaign Creation**: Advertiser → Campaign → Advertisement → Placement
3. **Reporting**: Use entity IDs with date ranges

## Files in This Reference

- [`entities/`](./entities/) - Detailed entity documentation
- [`examples/`](./examples/) - Code examples and workflows  
- [`patterns/`](./patterns/) - Common implementation patterns

---

*Generated from Broadstreet API v1 documentation*