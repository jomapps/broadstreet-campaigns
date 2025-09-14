# User Guide

**Application**: Broadstreet Campaigns  
**Audience**: End users and content managers  
**Purpose**: Complete guide to using the application effectively  

## 🚀 Getting Started

### **First-Time Setup**
1. **Open the application** in your web browser
2. **Check connectivity** - ensure green status indicators
3. **Select your network** - typically "Schwulissimo.de" 
4. **Familiarize yourself** with the navigation sidebar

### **Understanding the Interface**

**Header Section:**
- **Application name** and current page title
- **Filter controls** for network, advertiser, and campaign selection
- **Status indicators** for API connectivity

**Sidebar Navigation:**
- **Dashboard** - Overview and quick actions
- **Networks** - Website properties management
- **Zones** - Ad placement locations
- **Advertisers** - Company management
- **Advertisements** - Creative content library
- **Campaigns** - Campaign management
- **Local Only** - Locally created entities
- **Sync Controls** - Data synchronization tools

**Main Content Area:**
- **Entity cards** with detailed information
- **Filter results** based on sidebar selections
- **Creation buttons** (+ icon) for new entities
- **Search and sorting** controls

## 📊 Working with Entities

### **Networks**
Networks represent the websites where advertisements are displayed.

**Main Networks:**
- **Schwulissimo.de** - Primary LGBTQ+ content platform
- **TravelM.de** - Travel and tourism platform

**How to Use:**
1. **Select network** in sidebar filter
2. **View network details** including website URL and logo
3. **See entity counts** (advertisers, zones) for each network
4. **Access network-specific** entities through filtering

### **Zones**
Zones define where advertisements can be placed on websites.

**Zone Types:**
- **SQ (Square)** - 300x250, 250x250 banner placements
- **PT (Portrait)** - 160x600, 120x600 tall placements  
- **LS (Landscape)** - 728x90, 970x250 wide placements

**Working with Zones:**
1. **Filter by network** to see relevant zones
2. **Search by keywords** to find specific zones
3. **Create new zones** using the + button
4. **View zone categories** automatically detected by name

**Creating a Zone:**
1. Click the **+ button** in zones page
2. Enter **zone name** (required)
3. **Network is pre-selected** from sidebar filter
4. **Expand optional sections** for additional settings:
   - Basic Settings: Advertisement count, duplicate settings
   - Display Type: Standard or rotation with intervals
   - Sizing: Width and height dimensions
   - Advanced: Alias, custom CSS, special flags
5. Click **Create Zone**

### **Advertisers**
Advertisers are the companies that run advertising campaigns.

**Working with Advertisers:**
1. **Filter by network** to see network-specific advertisers
2. **View company information** including website and notes
3. **Track campaign counts** for each advertiser
4. **Create new advertisers** for local businesses

**Creating an Advertiser:**
1. Click the **+ button** in advertisers page
2. Enter **advertiser name** (required)
3. **Network is pre-selected** from sidebar filter
4. **Expand optional sections** for additional information:
   - Basic Settings: Website URL, notes
   - Advanced Settings: Admin contact information
5. Click **Create Advertiser**

### **Campaigns**
Campaigns are time-bound advertising initiatives that group advertisements with zones.

**Campaign Properties:**
- **Name** - Campaign identifier
- **Dates** - Start and end dates with smart time defaults
- **Weight** - Priority level (Remnant, Low, Default, High, Sponsorship)
- **Advertiser** - Company running the campaign
- **Placements** - Connections between advertisements and zones

**Working with Campaigns:**
1. **Filter by advertiser** to see their campaigns
2. **View campaign status** (active/inactive) and dates
3. **Check placement counts** to see campaign reach
4. **Monitor campaign performance** through status indicators

**Creating a Campaign:**
1. Click the **+ button** in campaigns page
2. Enter **campaign name** (required)
3. **Select start date** (defaults to 12:00 AM)
4. **Choose campaign weight** from dropdown
5. **Network and advertiser** are pre-selected from sidebar filters
6. **Expand optional sections** for advanced settings:
   - Basic Settings: End date, impression limits
   - Display Settings: Display type, pacing
   - Advanced Settings: Notes and custom paths
7. Click **Create Campaign**

### **Advertisements**
Advertisements are the creative content used in campaigns.

**Advertisement Types:**
- **Image** - Banner images and graphics
- **Text** - Text-based advertisements
- **Video** - Video content advertisements
- **Native** - Content-integrated advertisements

**Working with Advertisements:**
1. **Filter by type** to see specific advertisement categories
2. **View previews** and advertiser associations
3. **Check active placement** status
4. **Note**: Advertisement creation requires Broadstreet backend

**About Advertisement Creation:**
Advertisement creation is complex and requires features not available through the API. When you click the + button, you'll be directed to log into the Broadstreet backend to create advertisements. Remember to sync afterward to see your new advertisements in the local application.

## 🔄 Local Entity Management

### **Local Only Dashboard**
The Local Only dashboard (`/local-only`) is your central hub for managing entities created locally before they're synced to Broadstreet.

**Features:**
- **View all local entities** across all types
- **Delete individual entities** using the × button
- **Sync all entities** to Broadstreet API
- **Delete all local entities** for cleanup

**Entity Sections:**
- **Networks** - Locally created networks (note: requires backend creation)
- **Zones** - Local zones with size detection
- **Advertisers** - Local companies and organizations
- **Campaigns** - Local advertising campaigns
- **Advertisements** - Local creative content

### **Visual Indicators**
**Local entities** are visually distinct from synced entities:
- **Orange gradient background** instead of white
- **Thick orange border** for emphasis
- **🏠 Local badge** in the top corner
- **Enhanced shadow** with orange tint

**Synced entities** have:
- **Clean white background**
- **Gray borders**
- **Standard shadows**
- **No special badges**

## 🔄 Synchronization

### **Understanding Sync**
The application uses a dual-system approach:
1. **Create entities locally** for immediate use
2. **Sync to Broadstreet API** when ready
3. **Move to production** after successful sync

### **Sync Operations**

**Import from Broadstreet:**
- **Purpose**: Get latest data from Broadstreet platform
- **Location**: Sidebar sync controls or dashboard
- **Result**: Updates local production data

**Export Local Entities:**
- **Purpose**: Send locally created entities to Broadstreet
- **Location**: Local Only dashboard "Sync All" button
- **Result**: Moves local entities to production after API confirmation

**Individual Sync:**
- **Purpose**: Sync specific entity types
- **Location**: Entity-specific pages or Local Only dashboard
- **Result**: Targeted synchronization

### **Sync Process**
1. **Dependency resolution** - Ensures proper creation order
2. **Name conflict detection** - Automatically resolves duplicate names
3. **Clean data validation** - Ensures API compatibility
4. **Status tracking** - Real-time sync progress
5. **Error handling** - Graceful failure recovery

## 🎯 Placement Creation Utility

### **Fallback Ad Utility**
The placement creation utility helps you quickly create advertisements across multiple zones.

**When to Use:**
- Setting up fallback advertisements for campaigns
- Bulk placement creation across size categories
- Quick campaign deployment

**How to Use:**
1. **Navigate to placements** page
2. **Set filters** for network, advertiser, and campaign
3. **Click + button** to open placement utility
4. **Follow the 6-step wizard:**
   - Step 1: Confirm network selection
   - Step 2: Confirm advertiser selection  
   - Step 3: Confirm campaign selection
   - Step 4: Select advertisements (multiple selection)
   - Step 5: Choose size types (SQ, PT, LS)
   - Step 6: Review and confirm placements
5. **Submit** to create all placements

**Zone Matching:**
- **Automatic detection** of zone size types by name
- **Whole-word matching** for accuracy
- **Numbered variations** (SQ1, SQ2) supported
- **Bulk creation** across matched zones

## 🔍 Filtering and Search

### **Hierarchical Filtering**
The application uses smart filtering that flows through entity relationships:

**Filter Flow:**
1. **Network** selection filters all other entities
2. **Advertiser** selection filters campaigns and placements
3. **Campaign** selection filters placements

**Setting Filters:**
1. **Use sidebar controls** for persistent filtering
2. **Filter state persists** across page navigation
3. **Clear filters** using the × buttons
4. **Filters are URL-based** for bookmarking

### **Search Functionality**
- **Zone search** by keywords in zone names
- **Entity filtering** by type and category
- **Real-time results** as you type
- **Category grouping** for easier browsing

## 📊 Dashboard Overview

### **Entity Count Cards**
The dashboard shows:
- **Total entity counts** across all types
- **Network-specific breakdowns** when filtered
- **Quick navigation** to entity pages
- **Status indicators** for data freshness

### **Quick Actions**
- **Create new entities** directly from dashboard
- **Access sync operations** without navigation
- **View recent activity** and changes
- **Monitor system health** and connectivity

## 🚨 Common Tasks

### **Setting Up a New Campaign**
1. **Create advertiser** (if new company)
2. **Create campaign** with start/end dates
3. **Create or select advertisements**
4. **Use placement utility** to connect ads to zones
5. **Sync to Broadstreet** when ready

### **Managing Local Entities**
1. **Create entities locally** for testing
2. **Review in Local Only** dashboard
3. **Make adjustments** before syncing
4. **Sync when satisfied** with configuration
5. **Clean up** any unwanted local entities

### **Troubleshooting Issues**
1. **Check connectivity** status indicators
2. **Review filter settings** if entities are missing
3. **Clear browser cache** for UI issues
4. **Check Local Only dashboard** for unsynced entities
5. **Consult troubleshooting guide** for specific errors

## 💡 Best Practices

### **Entity Naming**
- **Use descriptive names** that identify purpose
- **Include size hints** in zone names (SQ, PT, LS)
- **Avoid special characters** that might cause API issues
- **Keep names concise** but informative

### **Campaign Management**
- **Set realistic date ranges** for campaigns
- **Use appropriate weights** based on priority
- **Group related advertisements** in single campaigns
- **Monitor placement counts** for reach optimization

### **Local Development**
- **Test locally first** before syncing
- **Use Local Only dashboard** for review
- **Sync regularly** to avoid conflicts
- **Clean up test data** when finished

### **Data Hygiene**
- **Remove unused entities** to reduce clutter
- **Keep names consistent** across related entities
- **Regular sync operations** to maintain freshness
- **Monitor for conflicts** and resolve quickly

---

**Need Help?** Check the [Troubleshooting Guide](./troubleshooting.md) for common issues or consult the [Best Practices](./best-practices.md) for implementation guidance.
