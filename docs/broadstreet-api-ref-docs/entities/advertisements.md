# Advertisements

**Description**: Individual ad creatives (banners, HTML ads) that can be placed in campaigns.

## Operations

### List All Advertisements
**Endpoint**: `GET /advertisements`
**Auth**: API Key required
**Query Parameters**: 
- `network_id` (integer, required) - The network to get advertisements from
- `zone_id` (integer, optional) - Filter by specific zone
- `advertiser_id` (integer, optional) - Filter by specific advertiser

```bash
# Get all ads for a network
curl "https://api.broadstreetads.com/v1/advertisements?network_id=1&api_key=YOUR_API_KEY"

# Get ads for specific zone
curl "https://api.broadstreetads.com/v1/advertisements?network_id=1&zone_id=2&api_key=YOUR_API_KEY"

# Get ads for specific advertiser
curl "https://api.broadstreetads.com/v1/advertisements?network_id=1&advertiser_id=3&api_key=YOUR_API_KEY"
```

**Response (200)**:
```json
{
  "advertisements": [
    {
      "id": 1,
      "name": "Campaign 1",
      "updated_at": "2022-05-18T07:38:46.000+12:00",
      "type": "StencilAdvertisement",
      "advertiser": "Advertiser Name 2",
      "active": {
        "url": null
      },
      "active_placement": true
    }
  ]
}
```

### Create Advertisement
**Endpoint**: `POST /advertisements`
**Auth**: API Key required
**Query Parameters**: 
- `advertiser_id` (integer, required) - The advertiser this ad belongs to

**Request Body**:
```json
{
  "type": "html",
  "name": "My Advertisement",
  "destination": "https://example.com/landing-page",
  "active_url": "https://example.com/banner-image.jpg",
  "active_base64": "base64_encoded_image_data_here"
}
```

**Field Options**:
- `type`: `"html"` for third-party creative, `"static"` for standard banner
- `name`: Display name for the advertisement
- `destination`: Click-through URL
- `active_url`: URL of the ad image (alternative to base64)
- `active_base64`: Base64-encoded image data (alternative to URL)

**Response (201)**:
```json
{
  "advertisement": {
    "id": 1,
    "name": "My Advertisement",
    "preferred_hash_tag": "#advert",
    "html": "<script type=\"text/javascript\" src=\"https://ad.broadstreetads.com/display/1.js\"></script>",
    "preview_html": "<script type=\"text/javascript\" src=\"https://ad.broadstreetads.com/display/1.js?preview=true\"></script>"
  }
}
```

**Response (422)**: Validation errors

## Entity Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | integer | Unique advertisement identifier |
| `name` | string | Advertisement display name |
| `updated_at` | datetime | Last modification timestamp |
| `type` | string | Advertisement type/format |
| `advertiser` | string | Advertiser name |
| `active` | object | Active creative information |
| `active_placement` | boolean | Whether ad is actively placed |
| `destination` | string | Click-through URL |
| `preferred_hash_tag` | string | Social media hashtag |
| `html` | string | Embed code for live ad |
| `preview_html` | string | Embed code for preview |

## Advertisement Types

### HTML Advertisements
- **Type**: `"html"`
- **Use Case**: Third-party creatives, rich media
- **Upload**: Provide URL or base64 data
- **Output**: JavaScript embed code

### Static Advertisements  
- **Type**: `"static"`
- **Use Case**: Standard banner ads, images
- **Upload**: Provide URL or base64 data
- **Output**: Image-based ad serving

## Common Patterns

### Image Upload Options
You can provide creative content via two methods:

1. **URL Method**:
```json
{
  "active_url": "https://example.com/banner.jpg"
}
```

2. **Base64 Method**:
```json
{
  "active_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
}
```

### Embed Code Usage
After creation, use the provided embed codes:

- **Live**: Use `html` field in production
- **Preview**: Use `preview_html` field for testing

### Advertisement Lifecycle
1. **Create**: Upload creative and set destination
2. **Review**: Use preview HTML to test
3. **Place**: Create placements to assign to zones
4. **Activate**: Advertisement serves based on campaign settings
5. **Monitor**: Track performance via reporting

### Naming Conventions
- Use descriptive names: "Q4 2024 Holiday Banner"
- Include dimensions if relevant: "Leaderboard 728x90"
- Add version numbers for iterations: "Summer Sale v2"

## Related Entities
- [Advertisers](./advertisers.md) - Parent entity
- [Campaigns](./campaigns.md) - Campaign assignments
- [Placements](./placements.md) - Zone assignments
- [Zones](./zones.md) - Placement targets