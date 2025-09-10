# App Overview

## 🎯 Purpose

The Broadstreet Campaigns application is a comprehensive dashboard for managing advertising campaigns, networks, advertisers, and zones. It provides tools for data synchronization, campaign management, and fallback ad creation.

## 🏗️ Architecture

### Core Components
- **Dashboard**: Overview of all campaigns and system status
- **Networks**: Management of advertising networks
- **Advertisers**: Company and advertiser management
- **Campaigns**: Campaign creation and monitoring
- **Zones**: Ad placement zone management
- **Advertisements**: Ad creative management
- **Local Only**: Centralized management of unsynced local entities

### Key Features
- **Real-time Data Sync**: Synchronize data with Broadstreet API with proper validation
- **Local Entity Management**: Create and manage entities locally before syncing
- **Advanced Filtering**: Filter content by network, advertiser, and campaign
- **Fallback Ad Creation**: Automated fallback ad placement system
- **Entity Lifecycle Management**: Proper handling of local vs synced entities
- **Responsive Design**: Works on desktop and mobile devices
- **Persistent State**: Filter selections saved across sessions

## 🔄 Data Flow

```
Broadstreet API → Sync Operations → MongoDB → UI Components
                     ↓
              Filter System → Filtered Views
                     ↓
         Local Entities → Local Only Dashboard → Sync to API
```

## 🎨 User Interface

### Layout Structure
- **Sidebar**: Contains filters and utilities (collapsible)
- **Header**: Navigation and system status
- **Main Content**: Page-specific content with filtering applied
- **Cards**: Interactive components for data display and selection

### Design Principles
- **Consistent Styling**: Unified color scheme and typography
- **Interactive Elements**: Clear visual feedback for user actions
- **Responsive Grid**: Adaptive layouts for different screen sizes
- **Loading States**: Skeleton loaders and progress indicators

## 🔧 Technical Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **Database**: MongoDB with Mongoose ODM
- **State Management**: React Context API
- **API**: Next.js API routes
- **Icons**: Lucide React

## 📊 Data Models

### Core Entities
- **Networks**: Advertising networks (websites)
- **Advertisers**: Companies running campaigns
- **Campaigns**: Advertising campaigns
- **Zones**: Ad placement locations
- **Advertisements**: Ad creatives
- **Placements**: Campaign-zone-advertisement relationships

### Local Entity Collections
- **Local Networks**: Locally created networks awaiting sync
- **Local Advertisers**: Locally created advertisers awaiting sync
- **Local Campaigns**: Locally created campaigns awaiting sync
- **Local Zones**: Locally created zones awaiting sync
- **Local Advertisements**: Locally created advertisements awaiting sync

### Relationships
- Networks contain multiple Zones
- Advertisers have multiple Campaigns
- Campaigns are placed in Zones via Placements
- Advertisements are associated with Campaigns

## 🚀 Getting Started

1. **Access the Dashboard**: Navigate to the main dashboard
2. **Sync Data**: Use sync operations to load latest data
3. **Set Filters**: Select network, advertiser, and campaign filters
4. **Explore Data**: Browse through filtered content
5. **Use Utilities**: Access tools like fallback ad creation

## 📈 Performance Considerations

- **Lazy Loading**: Components load data on demand
- **Caching**: API responses cached for better performance
- **Optimistic Updates**: UI updates immediately with rollback on errors
- **Pagination**: Large datasets handled efficiently

## 🔒 Security Features

- **Input Validation**: All user inputs validated
- **API Protection**: Secure API endpoints
- **Data Sanitization**: XSS and injection protection
- **Error Handling**: Graceful error handling and user feedback

---

*For detailed usage instructions, see the [User Guide](./user-guide.md)*
