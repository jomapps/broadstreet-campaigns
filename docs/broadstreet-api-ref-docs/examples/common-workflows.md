# Common Workflows

This document provides step-by-step examples for typical Broadstreet API usage patterns.

## Complete Campaign Setup

### 1. Initial Setup (One-time)

```bash
# Create network
curl -X POST "https://api.broadstreetads.com/v1/networks" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Publishing Network",
    "web_home_url": "https://mypublisher.com"
  }' \
  "?api_key=YOUR_API_KEY"

# Response: {"network": {"id": "1", ...}}
NETWORK_ID=1

# Create zones for ad placements
curl -X POST "https://api.broadstreetads.com/v1/zones?network_id=${NETWORK_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Homepage Header",
    "alias": "home-header"
  }' \
  "?api_key=YOUR_API_KEY"

# Response: {"zone": {"id": 10, ...}}
ZONE_ID=10
```

### 2. Advertiser Onboarding

```bash
# Create advertiser
curl -X POST "https://api.broadstreetads.com/v1/advertisers?network_id=${NETWORK_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ACME Corporation",
    "web_home_url": "https://acme.com",
    "notes": "Premium advertiser - high value client"
  }' \
  "?api_key=YOUR_API_KEY"

# Response: {"advertiser": {"id": "5", ...}}
ADVERTISER_ID=5

# Add advertiser admin (optional)
curl -X POST "https://api.broadstreetads.com/v1/advertisers/${ADVERTISER_ID}/advertiser_admins?user_id=42" \
  "?api_key=YOUR_API_KEY"
```

### 3. Creative Upload

```bash
# Create advertisement
curl -X POST "https://api.broadstreetads.com/v1/advertisements?advertiser_id=${ADVERTISER_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "static",
    "name": "Summer Sale Banner 2024",
    "destination": "https://acme.com/summer-sale",
    "active_url": "https://acme.com/banners/summer-sale-728x90.jpg"
  }' \
  "?api_key=YOUR_API_KEY"

# Response: {"advertisement": {"id": 100, ...}}
ADVERTISEMENT_ID=100
```

### 4. Campaign Creation

```bash
# Create campaign
curl -X POST "https://api.broadstreetads.com/v1/campaigns?advertiser_id=${ADVERTISER_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Q3 Summer Sale Campaign",
    "start_date": "2024-07-01",
    "end_date": "2024-09-30",
    "max_impression_count": 100000,
    "display_type": "no_repeat",
    "pacing_type": "even",
    "impression_max_type": "cap",
    "weight": "1",
    "notes": "Seasonal campaign targeting summer months"
  }' \
  "?api_key=YOUR_API_KEY"

# Response: {"campaign": {"id": 200, ...}}
CAMPAIGN_ID=200
```

### 5. Placement Assignment

```bash
# Create placement to assign ad to zone
curl -X POST "https://api.broadstreetads.com/v1/placements" \
  -H "Content-Type: application/json" \
  -d '{
    "campaign_id": '${CAMPAIGN_ID}',
    "advertisement_id": '${ADVERTISEMENT_ID}',
    "zone_id": '${ZONE_ID}',
    "restrictions": null
  }' \
  "?api_key=YOUR_API_KEY"
```

## Multi-Device Campaign

```bash
# Create mobile-optimized ad
curl -X POST "https://api.broadstreetads.com/v1/advertisements?advertiser_id=${ADVERTISER_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "static",
    "name": "Mobile Banner - Summer Sale",
    "destination": "https://acme.com/summer-sale?utm_source=mobile",
    "active_url": "https://acme.com/banners/mobile-320x50.jpg"
  }' \
  "?api_key=YOUR_API_KEY"

MOBILE_AD_ID=101

# Create desktop ad
curl -X POST "https://api.broadstreetads.com/v1/advertisements?advertiser_id=${ADVERTISER_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "static", 
    "name": "Desktop Banner - Summer Sale",
    "destination": "https://acme.com/summer-sale?utm_source=desktop",
    "active_url": "https://acme.com/banners/desktop-728x90.jpg"
  }' \
  "?api_key=YOUR_API_KEY"

DESKTOP_AD_ID=102

# Create device-specific placements
curl -X POST "https://api.broadstreetads.com/v1/placements" \
  -H "Content-Type: application/json" \
  -d '{
    "campaign_id": '${CAMPAIGN_ID}',
    "advertisement_id": '${MOBILE_AD_ID}',
    "zone_id": '${ZONE_ID}',
    "restrictions": "mobile"
  }' \
  "?api_key=YOUR_API_KEY"

curl -X POST "https://api.broadstreetads.com/v1/placements" \
  -H "Content-Type: application/json" \
  -d '{
    "campaign_id": '${CAMPAIGN_ID}',
    "advertisement_id": '${DESKTOP_AD_ID}',
    "zone_id": '${ZONE_ID}',
    "restrictions": "desktop"
  }' \
  "?api_key=YOUR_API_KEY"
```

## Campaign Management

### Update Campaign Dates
```bash
# Extend campaign end date
curl -X PUT "https://api.broadstreetads.com/v1/campaigns/${CAMPAIGN_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "end_date": "2024-10-31"
  }' \
  "?api_key=YOUR_API_KEY"
```

### Pause Campaign
```bash
# Pause campaign temporarily
curl -X PUT "https://api.broadstreetads.com/v1/campaigns/${CAMPAIGN_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "paused": true
  }' \
  "?api_key=YOUR_API_KEY"
```

## Performance Monitoring

### Get Campaign Performance
```bash
# Get summary performance for campaign
curl "https://api.broadstreetads.com/v1/records?type=campaign&id=${CAMPAIGN_ID}&summary=1&start_date=2024-07-01&end_date=2024-07-31&api_key=YOUR_API_KEY"

# Get hourly breakdown
curl "https://api.broadstreetads.com/v1/records?type=campaign&id=${CAMPAIGN_ID}&start_date=2024-07-01&end_date=2024-07-02&api_key=YOUR_API_KEY"
```

### Custom Reporting
```bash
# Performance by zone and device
curl "https://api.broadstreetads.com/v1/records?type=custom&network_id=${NETWORK_ID}&select=zone.name,count(view),count(mobile_view),count(click)&group=zone&start_date=2024-07-01&end_date=2024-07-31&api_key=YOUR_API_KEY"
```

## A/B Testing Setup

```bash
# Create two different ad creatives
# Ad A - Version 1
curl -X POST "https://api.broadstreetads.com/v1/advertisements?advertiser_id=${ADVERTISER_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "static",
    "name": "A/B Test - Version A",
    "destination": "https://acme.com/sale?variant=a",
    "active_url": "https://acme.com/banners/version-a.jpg"
  }' \
  "?api_key=YOUR_API_KEY"

AD_A_ID=103

# Ad B - Version 2
curl -X POST "https://api.broadstreetads.com/v1/advertisements?advertiser_id=${ADVERTISER_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "static",
    "name": "A/B Test - Version B", 
    "destination": "https://acme.com/sale?variant=b",
    "active_url": "https://acme.com/banners/version-b.jpg"
  }' \
  "?api_key=YOUR_API_KEY"

AD_B_ID=104

# Create separate campaigns with different weights
# Campaign A (50% weight)
curl -X POST "https://api.broadstreetads.com/v1/campaigns?advertiser_id=${ADVERTISER_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "A/B Test Campaign A",
    "start_date": "2024-07-01",
    "end_date": "2024-07-31",
    "max_impression_count": 50000,
    "weight": "1"
  }' \
  "?api_key=YOUR_API_KEY"

CAMPAIGN_A_ID=201

# Campaign B (50% weight)  
curl -X POST "https://api.broadstreetads.com/v1/campaigns?advertiser_id=${ADVERTISER_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "A/B Test Campaign B",
    "start_date": "2024-07-01", 
    "end_date": "2024-07-31",
    "max_impression_count": 50000,
    "weight": "1"
  }' \
  "?api_key=YOUR_API_KEY"

CAMPAIGN_B_ID=202

# Create placements for both variants
curl -X POST "https://api.broadstreetads.com/v1/placements" \
  -d '{"campaign_id": '${CAMPAIGN_A_ID}', "advertisement_id": '${AD_A_ID}', "zone_id": '${ZONE_ID}'}' \
  "?api_key=YOUR_API_KEY"

curl -X POST "https://api.broadstreetads.com/v1/placements" \
  -d '{"campaign_id": '${CAMPAIGN_B_ID}', "advertisement_id": '${AD_B_ID}', "zone_id": '${ZONE_ID}'}' \
  "?api_key=YOUR_API_KEY"
```

## Error Handling Examples

### Check Network Access
```bash
# Verify network exists and you have access
curl "https://api.broadstreetads.com/v1/networks/999?api_key=YOUR_API_KEY"
# Returns 404 if not found or no access
```

### Validate Campaign Dates
```bash
# This will fail - end date before start date
curl -X POST "https://api.broadstreetads.com/v1/campaigns?advertiser_id=${ADVERTISER_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Invalid Campaign",
    "start_date": "2024-07-31",
    "end_date": "2024-07-01"
  }' \
  "?api_key=YOUR_API_KEY"
# Returns 422 with validation errors
```

## Rate-Limited Reporting
```bash
#!/bin/bash
# Script to handle reporting rate limits

ENTITIES=(1 2 3 4 5)  # Array of campaign IDs

for entity_id in "${ENTITIES[@]}"; do
  echo "Fetching report for campaign $entity_id..."
  
  curl "https://api.broadstreetads.com/v1/records?type=campaign&id=$entity_id&summary=1&api_key=YOUR_API_KEY"
  
  # Wait 3 seconds to respect rate limit (2 requests per 5 seconds)
  sleep 3
done
```