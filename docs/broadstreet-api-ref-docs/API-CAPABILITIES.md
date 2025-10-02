# Broadstreet API Capabilities Summary

This document provides a comprehensive overview of what you can do with the Broadstreet API, organized by capability and use case.

## Core Capabilities Matrix

| Entity | Create | Read | Update | Delete | List | Special Operations |
|--------|--------|------|--------|--------|------|--------------------|
| **Networks** | ✅ | ✅ | ✅ | ❌ | ✅ | Get Highlights |
| **Advertisers** | ✅ | ✅ | ✅ | ✅ | ✅ | Admin Management |
| **Campaigns** | ✅ | ✅ | ✅ | ✅ | ✅ | Date/Weight Management |
| **Advertisements** | ✅ | ❌ | ❌ | ❌ | ✅ | HTML/Static Types |
| **Zones** | ✅ | ✅ | ✅ | ✅ | ✅ | Alias Support |
| **Placements** | ✅ | ❌ | ❌ | ✅ | ✅ | Device Targeting |
| **Network Admins** | ✅ | ❌ | ❌ | ✅ | ❌ | User Access Control |
| **Advertiser Admins** | ✅ | ❌ | ❌ | ❌ | ❌ | User Access Control |
| **Reporting** | ❌ | ✅ | ❌ | ❌ | ❌ | Custom + General |

## What You Can Do

### Network Management
- **Create networks** for different properties/websites
- **Update network settings** (name, logo, homepage URL)  
- **Get network statistics** (advertiser count, zone count)
- **View network highlights** (performance summaries)
- **Manage network-level admin access**

### Publisher Operations
- **Create ad zones** for different placements on your sites
- **Name zones descriptively** ("Header Banner", "Sidebar 300x250")
- **Use aliases** for developer-friendly zone references
- **Update zone configurations** as site layout changes
- **Remove zones** that are no longer needed

### Advertiser Onboarding
- **Create advertiser profiles** with contact information
- **Add advertiser notes** for account management
- **Grant advertiser-level admin access** for self-service
- **Update advertiser information** and notes
- **Remove advertisers** when relationships end

### Campaign Management
- **Create time-bound campaigns** with start/end dates
- **Set impression targets** (caps or goals)
- **Configure pacing** (ASAP vs. even distribution)
- **Set campaign weights** for priority delivery
- **Pause/resume campaigns** as needed
- **Update campaign parameters** (dates, targets, notes)
- **Archive campaigns** for historical tracking

### Creative Management
- **Upload ad creatives** via URL or base64 encoding
- **Support multiple formats** (HTML for rich media, static for banners)
- **Set click-through destinations** for each ad
- **Generate embed codes** for live and preview modes
- **Filter advertisements** by network, zone, or advertiser

### Placement & Targeting
- **Assign ads to zones** through placements
- **Target specific devices** (phone, tablet, desktop, mobile)
- **Create multiple placements** per campaign for multi-zone delivery
- **Remove placements** to stop ads in specific zones
- **Filter placements** by campaign

### Performance Analytics

#### Standard Reporting
- **Campaign performance** with impressions, clicks, hovers, conversions
- **Advertisement performance** across all placements
- **Advertiser performance** aggregated across campaigns
- **Network performance** for overall insights
- **Time-series data** (hourly breakdown) or summary totals
- **Custom date ranges** for specific analysis periods

#### Advanced Reporting  
- **Custom field selection** (choose specific metrics)
- **Multi-entity grouping** (campaign + zone + advertiser combinations)
- **Mobile vs. desktop breakdowns** with mobile_view metrics
- **Zone-level performance** analysis
- **Cross-advertiser comparisons** within networks

#### Calculated Metrics
- **Click-through rates** (clicks / impressions)
- **Conversion rates** (conversions / clicks) 
- **Engagement rates** (hovers + clicks / impressions)
- **Mobile performance** ratios and comparisons

## Business Use Cases

### Ad Network Operations
```
✅ Multi-tenant network management
✅ Publisher zone setup and management  
✅ Advertiser onboarding and self-service
✅ Campaign scheduling and delivery control
✅ Cross-network performance analytics
✅ Admin access control and permissions
```

### Direct Sales Management
```
✅ Campaign creation and management
✅ Creative upload and approval workflows
✅ Placement optimization across zones
✅ Performance tracking and reporting
✅ Client self-service portals
✅ Renewal and upsell insights
```

### Programmatic Integration
```
✅ Automated campaign creation
✅ Dynamic creative management
✅ Real-time placement adjustments
✅ Performance-based optimization
✅ Bulk operations via API
✅ Integration with external systems
```

### Agency Management
```
✅ Multi-client campaign management
✅ Client-specific access controls
✅ Cross-client performance comparison
✅ Bulk campaign operations
✅ Automated reporting delivery
✅ White-label implementations
```

## Technical Capabilities

### Authentication & Security
- **API key-based authentication** for all operations
- **Scoped access control** (network vs. advertiser level)
- **HTTPS-only communication** for data security
- **Rate limiting** to prevent abuse (2 req/5s for reporting)

### Data Formats & Standards
- **JSON request/response bodies** for all operations
- **ISO 8601 date formats** (YYYY-MM-DD) for consistency
- **Base64 image encoding** support for creative uploads
- **URL-based image uploads** as alternative to base64
- **Standardized error responses** with HTTP status codes

### Integration Features
- **RESTful API design** following standard conventions
- **Predictable URL patterns** for easy integration
- **Consistent response structures** across endpoints
- **Detailed error messages** for debugging
- **OpenAPI specification** available for code generation

### Performance & Scale
- **Efficient list operations** with filtering parameters
- **Batch-friendly patterns** for bulk operations
- **Caching-friendly designs** with predictable responses
- **Rate limiting** that prevents system overload
- **Optimized reporting queries** for large datasets

## Limitations & Constraints

### API Restrictions
- **No advertisement updates** after creation (create new ones instead)
- **No direct placement updates** (delete and recreate)
- **Reporting rate limits** (2 requests per 5 seconds maximum)
- **Network deletion** not supported via API
- **Cannot remove last network admin** (prevents orphaned networks)

### Data Constraints
- **Campaign dates** must be logical (end after start)
- **Entity relationships** must exist (advertiser → campaign → placement)
- **Device restrictions** limited to predefined values
- **Image uploads** have size/format constraints
- **API key scope** determines accessible resources

### Business Logic
- **Campaign weight affects delivery** but exact algorithms not exposed
- **Impression caps** cause campaign deactivation when exceeded  
- **Date ranges** determine campaign eligibility for serving
- **Admin permissions** cascade through entity hierarchy
- **Zone availability** affects placement creation success

## Common Integration Patterns

### Campaign Automation
```javascript
// Full campaign setup in sequence
const campaign = await createCompleteCampaign({
  networkId: 1,
  advertiserData: { name: "ACME Corp", web_home_url: "https://acme.com" },
  campaignData: { 
    name: "Q4 Campaign", 
    start_date: "2024-10-01", 
    end_date: "2024-12-31",
    max_impression_count: 100000
  },
  advertisementData: {
    type: "static",
    name: "Q4 Banner",
    destination: "https://acme.com/q4-sale"
  },
  zoneIds: [1, 2, 3]
});
```

### Performance Dashboard
```javascript
// Multi-level reporting for dashboards
const networkStats = await getNetworkHighlights(networkId);
const campaignPerformance = await getCampaignReports(campaignIds);
const zoneBreakdown = await getCustomReport({
  select: "zone.name,count(view),count(click)",
  group: "zone"
});
```

### Client Self-Service
```javascript
// Enable advertiser self-management
await createAdvertiser(networkId, advertiserData);
await addAdvertiserAdmin(advertiserId, clientUserId);
// Client can now manage their own campaigns and ads
```

This comprehensive capabilities matrix provides the foundation for understanding what's possible with the Broadstreet API and how to implement various advertising technology workflows.