# Broadstreet System Structure

**External System**: Broadstreet Advertising Platform  
**API Version**: v1  
**Purpose**: External advertising platform for campaign management  

## 🌐 Overview

This document describes the external Broadstreet advertising platform structure and how it relates to our local application. Broadstreet serves as the source of truth for all advertising data and campaign execution.

## 🏗️ Broadstreet Architecture

### **Core Entities**
The Broadstreet platform organizes advertising data in a hierarchical structure:

```
Networks (Websites)
├── Zones (Ad Placements)
├── Advertisers (Companies)
│   └── Campaigns (Time-bound Initiatives)
│       └── Advertisements (Creative Content)
│           └── Placements (Zone + Ad Combinations)
```

### **Entity Relationships**
```
Networks (1) ──→ (many) Zones
Networks (1) ──→ (many) Advertisers
Advertisers (1) ──→ (many) Campaigns
Campaigns (1) ──→ (many) Placements [embedded]
Advertisements (1) ──→ (many) Placements [referenced]
Zones (1) ──→ (many) Placements [referenced]
```

## 📊 Entity Details

### **Networks**
Networks represent different websites where ads are displayed.

**For our application:**
- **Primary Network**: Schwulissimo.de
- **Secondary Network**: TravelM.de

**Key Properties:**
```typescript
interface Network {
  id: number;                    // Broadstreet unique identifier
  name: string;                  // Human-readable name
  group_id: number | null;       // Network group (if applicable)
  web_home_url: string;          // Website homepage URL
  logo: { url: string };         // Network logo
  valet_active: boolean;         // Valet service status
  path: string;                  // API path reference
  advertiser_count?: number;     // Number of advertisers
  zone_count?: number;           // Number of zones
}
```

### **Zones**
Zones define possible ad placement locations on websites.

**Common Zone Types in our networks:**
- **SQ (Square)**: 300x250, 250x250 square banners
- **PT (Portrait)**: 160x600, 120x600 tall banners
- **LS (Landscape)**: 728x90, 970x250 wide banners

**Key Properties:**
```typescript
interface Zone {
  id: number;                    // Broadstreet unique identifier
  name: string;                  // Zone name (contains size hints)
  network_id: number;            // Parent network ID
  alias: string | null;          // Short reference name
  self_serve: boolean;           // Self-service availability
}
```

### **Advertisers**
Advertisers are companies that run advertising campaigns.

**Key Properties:**
```typescript
interface Advertiser {
  id: number;                    // Broadstreet unique identifier
  name: string;                  // Company name
  logo: { url: string } | null;  // Company logo
  web_home_url: string;          // Company website
  notes: string | null;          // Special notes
  admins: Array<{                // Admin contacts
    name: string;
    email: string;
  }>;
}
```

### **Campaigns**
Campaigns group advertisements with time bounds and targeting.

**Key Properties:**
```typescript
interface Campaign {
  id: number;                    // Broadstreet unique identifier
  name: string;                  // Campaign name
  advertiser_id: number;         // Parent advertiser ID
  start_date: string;            // ISO date string
  end_date: string | null;       // ISO date string (optional)
  max_impression_count: number;  // Impression limit
  display_type: string;          // Repeat behavior
  active: boolean;               // Campaign status
  weight: number;                // Priority (0, 0.5, 1, 1.5, 127)
  path: string;                  // API path reference
}
```

**Weight Values:**
- `0` - Remnant (lowest priority)
- `0.5` - Low priority
- `1` - Default priority
- `1.5` - High priority
- `127` - Sponsorship (highest priority)

**Display Types:**
- `no_repeat` - No repetition on same page
- `allow_repeat_campaign` - Allow same campaign
- `allow_repeat_advertisement` - Allow same ad
- `force_repeat_campaign` - Force campaign repetition

### **Advertisements**
Advertisements contain the creative content for campaigns.

**Key Properties:**
```typescript
interface Advertisement {
  id: number;                    // Broadstreet unique identifier
  name: string;                  // Advertisement name
  updated_at: string;            // Last update timestamp
  type: string;                  // Ad type (image, text, video, native)
  advertiser: string;            // Advertiser name
  active: { url: string | null }; // Image URL for static ads
  active_placement: boolean;     // Currently running status
  preview_url: string;           // Preview URL
}
```

### **Placements**
Placements connect advertisements to zones within campaigns.

**Key Properties:**
```typescript
interface Placement {
  advertisement_id: number;      // Advertisement reference
  zone_id: number;              // Zone reference
  restrictions: string[];        // Device/targeting restrictions
}
```

**Restriction Types:**
- `"phone"` - Mobile phones only
- `"non_phone"` - Exclude mobile phones
- `"tablet"` - Tablets only
- `"desktop"` - Desktop only
- `"mobile"` - Mobile devices (phones + tablets)

## 🔄 Data Synchronization Strategy

### **Source of Truth**
- **Broadstreet API** is the authoritative source
- **Local MongoDB** serves as a performance cache
- **Sync strategy** uses "clear and replace" pattern

### **Sync Process**
1. **Clear Phase**: Remove existing local data
2. **Fetch Phase**: Retrieve current data from Broadstreet API
3. **Store Phase**: Insert/update in local MongoDB
4. **Validation Phase**: Verify data consistency

### **Placement Handling**
Placements receive special handling due to their embedded nature:
1. **Clear placements** from all campaigns using `$unset`
2. **Fetch placements** for each campaign individually
3. **Embed placements** directly in campaign documents
4. **Validate relationships** between ads, zones, and campaigns

## 🔧 API Integration Details

### **Authentication**
```typescript
const apiRequest = async (endpoint: string) => {
  const url = `${BROADSTREET_API_BASE_URL}${endpoint}?access_token=${API_TOKEN}`;
  return await fetch(url);
};
```

### **Rate Limiting**
- **Reporting endpoints**: 2 requests per 5 seconds
- **Standard endpoints**: General rate limits apply
- **Batch operations**: Implement delays between requests

### **Error Handling**
```typescript
interface APIError {
  status: number;
  message: string;
  details?: any;
}

// Common error codes:
// 401 - Authentication failed
// 404 - Entity not found
// 422 - Validation error
// 429 - Rate limit exceeded
```

## 📍 Network-Specific Information

### **Schwulissimo.de Network**
- **Primary focus** of our application
- **Default selection** in network filters
- **Main advertising platform** for LGBTQ+ content
- **Zone categories**: All types (SQ, PT, LS)

### **TravelM.de Network**
- **Secondary network** for travel content
- **Alternative advertising channel**
- **Specialized zones** for travel-related content
- **Integrated campaign management**

## 🎯 Business Context

### **Campaign Types**
- **Seasonal campaigns** (Summer, Holiday, etc.)
- **Event-based advertising** (Pride, Travel seasons)
- **Brand awareness** campaigns
- **Product promotion** initiatives

### **Advertiser Categories**
- **Local businesses** (Restaurants, Services)
- **Tourism boards** and travel companies
- **LGBTQ+ community** organizations
- **Event promoters** and venues

### **Zone Utilization**
- **Homepage prominence** (High-value zones)
- **Sidebar placements** (Consistent visibility)
- **Content-integrated** advertising
- **Mobile optimization** across all placements

## 🔍 Monitoring and Analytics

### **Performance Metrics**
- **Impression counts** and delivery rates
- **Click-through rates** by zone and campaign
- **Conversion tracking** for advertisers
- **Revenue optimization** across networks

### **Reporting Capabilities**
```typescript
// Available reporting endpoints
GET /api/1/records?type=advertiser&id={id}
GET /api/1/records?type=campaign&id={id}
GET /api/1/records?type=advertisement&id={id}
GET /api/1/records?type=network&id={id}

// Custom reporting
GET /api/1/records?type=custom&network_id={id}&select=...&group=...
```

## 🚨 Important Considerations

### **Data Consistency**
- **API is source of truth** - local data may lag
- **Real-time updates** not available - sync periodically
- **Conflict resolution** needed for simultaneous edits

### **Business Rules**
- **Campaign dates** must be future or current
- **Advertiser permissions** may restrict operations
- **Zone availability** depends on campaign scheduling

### **Technical Limitations**
- **Complex advertisement creation** requires Broadstreet backend
- **Network creation** requires commercial contracts
- **Advanced reporting** has rate limiting

## 🔗 Integration Points

### **API Endpoints Used**
- `GET /networks` - Fetch all networks
- `GET /advertisers?network_id={id}` - Network advertisers
- `GET /zones?network_id={id}` - Network zones
- `GET /campaigns?advertiser_id={id}` - Advertiser campaigns
- `GET /advertisements?network_id={id}` - Network advertisements
- `GET /placements?campaign_id={id}` - Campaign placements

### **Creation Endpoints**
- `POST /advertisers` - Create advertiser
- `POST /campaigns` - Create campaign
- `POST /zones` - Create zone
- `POST /placements` - Create placement

### **Management Operations**
- Entity updates via PUT requests
- Entity deletion via DELETE requests
- Bulk operations for efficiency

---

**Note**: This external system documentation should remain current with Broadstreet platform changes. Consult the official Broadstreet API documentation for the most up-to-date technical specifications.
