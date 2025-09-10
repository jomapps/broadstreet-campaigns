# Zone Creation Documentation

## Overview
Based on the [Broadstreet Zone Creation Guide](https://information.broadstreetads.com/create-a-zone/) and API specifications, this document outlines the complete zone creation process and requirements.

## API Requirements (from api-specs.json)

### Zone Schema (API Response)
```json
{
  "id": "integer - The id of the zone",
  "name": "string - The name of the zone", 
  "network_id": "integer - The network id that the zone belongs to",
  "alias": "string - The zone alias if there is one (nullable)",
  "self_serve": "boolean - Is the zone a self serve zone"
}
```

### Zone Creation API Endpoint
- **URL**: `POST /zones`
- **Required Query Parameter**: `network_id` (integer)
- **Required Body Fields**:
  - `name` (string) - The name of the zone
- **Optional Body Fields**:
  - `alias` (string) - An alias that the zone can be referenced by alongside its id

## Broadstreet Dashboard Requirements

### Basic Settings (All Required)
1. **Name** - How you will find and identify the zone
   - Recommended naming convention based on location (e.g., "Top Banner 500×250")
   
2. **Advertisement Count** - Maximum number of ads to show in this unit
   - Default: 1
   - For Standard display: number of ads displayed simultaneously
   - For Rotation display: number of ads that will rotate through
   
3. **Allow Duplicate Ads?** - Whether same ad can appear multiple times on same page
   - Default: false (prevents duplicates)
   
4. **Concurrent Campaigns** - Maximum number of advertisements in zone
   - Informational setting for availability records
   
5. **Advertisement Label** - Text label above zone on website
   - Example: "Advertisement"
   - Leave blank for no label
   
6. **Archived?** - Whether zone appears on webpage
   - Can only archive if no campaigns running

### Display Type
1. **Standard** - Different ad after every page refresh
2. **Rotation** - Different ad based on time interval
   - Requires rotation interval (in milliseconds)
   - Optional animation type for transitions

### Sizing (Optional)
- **Width** and **Height** in pixels
- Only required for AMP customers
- Helps avoid distorted images

### Advanced Settings
1. **RSS Shuffle** - For newsletters with RSS enabled
2. **Style** - Additional CSS styles for specific zone
3. **Alias** - Shorthand name for ad tags

## Complete Zone Creation Fields

### Required Fields
- `name` (string) - Zone name
- `network_id` (integer) - Network the zone belongs to

### Optional Fields
- `alias` (string) - Zone alias for ad tags
- `advertisement_count` (integer) - Max ads in zone (default: 1)
- `allow_duplicate_ads` (boolean) - Allow same ad multiple times (default: false)
- `concurrent_campaigns` (integer) - Max concurrent campaigns
- `advertisement_label` (string) - Label text above zone
- `archived` (boolean) - Whether zone is archived (default: false)
- `display_type` (string) - "standard" or "rotation"
- `rotation_interval` (integer) - Interval in milliseconds (if rotation)
- `animation_type` (string) - Animation for rotation transitions
- `width` (integer) - Zone width in pixels
- `height` (integer) - Zone height in pixels
- `rss_shuffle` (boolean) - RSS shuffle for newsletters
- `style` (string) - Custom CSS styles
- `self_serve` (boolean) - Whether zone is self-serve (default: false)

## Implementation Notes

### Database Strategy
- Create separate collections for locally created items
- Include all fields (required and optional) in local storage
- Sync operations should not overwrite locally created items
- Track creation status and sync status separately

### Form Validation
- Name is required and should be unique within network
- Alias should be unique within network if provided
- Numeric fields should validate ranges
- Display type "rotation" requires rotation interval

### User Experience
- Pre-populate network from sidebar filter
- Show helpful examples for naming conventions
- Provide clear explanations for each field
- Validate in real-time with helpful error messages
