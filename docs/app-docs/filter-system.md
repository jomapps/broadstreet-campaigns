# Filter System Guide

## 🎯 Overview

The Filter System is a powerful feature that allows you to focus on specific data by selecting networks, advertisers, and campaigns. All pages (except the dashboard) will show only data related to your selected filters.

## 📍 Location

The Filter System is located in the **sidebar** in a dedicated "Filters" card. It's always visible when the sidebar is expanded and provides persistent filtering across all pages.

## 🔧 Filter Components

### 1. Network Filter
- **Type**: Dropdown selector
- **Purpose**: Select the advertising network to focus on
- **Behavior**: 
  - Shows all available networks
  - Small font size for long network names
  - Displays "Valet" badge for valet-active networks
  - Automatically loads advertisers when changed

### 2. Advertiser Filter
- **Type**: Selection display (set via advertiser page)
- **Purpose**: Show only data for the selected advertiser
- **Behavior**:
  - Shows "Select on advertisers page" when not set
  - Displays selected advertiser name when set
  - Automatically loads campaigns when changed
  - Can be cleared independently

### 3. Campaign Filter
- **Type**: Selection display (set via campaign page)
- **Purpose**: Show only data for the selected campaign
- **Behavior**:
  - Shows "Select on campaigns page" when not set
  - Displays selected campaign name when set
  - Can be cleared independently
  - Requires advertiser to be selected first

## 🎨 Visual Design

### Filter Card Layout
```
┌─────────────────────────┐
│ 🔍 Filters              │
│ Filter content by...    │
│                         │
│ Network                 │
│ [Dropdown ▼]            │
│                         │
│ Advertiser              │
│ [Selected Name] [×]     │
│                         │
│ Campaign                │
│ [Selected Name] [×]     │
└─────────────────────────┘
```

### Visual States
- **Empty State**: Shows placeholder text
- **Loading State**: Animated skeleton loaders
- **Selected State**: Shows selected item with clear button
- **Error State**: Shows error message with retry option

## 🔄 How to Use Filters

### Setting Network Filter
1. **Expand Sidebar**: Ensure sidebar is not collapsed
2. **Locate Filters Card**: Find the "Filters" section
3. **Click Network Dropdown**: Click on the network selector
4. **Select Network**: Choose from the dropdown list
5. **Wait for Loading**: Advertisers will load automatically

### Setting Advertiser Filter
1. **Navigate to Advertisers Page**: Go to `/advertisers`
2. **Find Desired Advertiser**: Locate the advertiser card
3. **Click Checkbox**: Click the checkbox on the advertiser card
4. **Verify Selection**: Card will highlight and show "Selected" badge
5. **Check Sidebar**: Advertiser will appear in filters sidebar

### Setting Campaign Filter
1. **Navigate to Campaigns Page**: Go to `/campaigns`
2. **Find Desired Campaign**: Locate the campaign card
3. **Click Checkbox**: Click the checkbox on the campaign card
4. **Verify Selection**: Card will highlight and show "Selected" badge
5. **Check Sidebar**: Campaign will appear in filters sidebar

## 💾 Persistence & Storage

### Local Storage
- **Automatic Saving**: All filter selections are saved automatically
- **Cross-Session**: Filters persist when you close and reopen the browser
- **Storage Keys**:
  - `broadstreet_selected_network`
  - `broadstreet_selected_advertiser`
  - `broadstreet_selected_campaign`

### Data Loading
- **On App Start**: Saved filters are restored automatically
- **Network Change**: Advertisers reload when network changes
- **Advertiser Change**: Campaigns reload when advertiser changes
- **Error Handling**: Graceful fallback if saved data is invalid

## 🎯 Filter Effects

### Pages Affected
- **Networks Page**: Shows all networks (not filtered)
- **Advertisers Page**: Shows only advertisers for selected network
- **Campaigns Page**: Shows only campaigns for selected advertiser
- **Zones Page**: Shows only zones for selected network
- **Advertisements Page**: Shows only ads for selected advertiser
- **Dashboard**: Shows overview data (not filtered)

### Data Relationships
```
Network → Advertisers → Campaigns
   ↓           ↓           ↓
 Zones    Advertisements  Placements
```

## 🧹 Clearing Filters

### Individual Clear
- **Network**: Select different network or clear all
- **Advertiser**: Click × button next to advertiser name
- **Campaign**: Click × button next to campaign name

### Clear All Filters
- **Method**: Click the × button in the Filters card header
- **Effect**: Removes all filter selections
- **Result**: All pages show unfiltered data

### Automatic Clearing
- **Network Change**: Clears advertiser and campaign filters
- **Advertiser Change**: Clears campaign filter
- **Data Sync**: May clear filters if selected items no longer exist

## 🔄 Filter Interactions

### Dependency Chain
1. **Network** must be selected before advertiser filtering works
2. **Advertiser** must be selected before campaign filtering works
3. **Campaign** can only be selected after advertiser is chosen

### State Management
- **Loading States**: Show skeleton loaders during data fetching
- **Error States**: Display error messages with retry options
- **Empty States**: Show helpful messages when no data is available
- **Success States**: Display selected items with clear options

## 🎨 Visual Feedback

### Selection Indicators
- **Checkboxes**: Show checked state for selected items
- **Card Highlighting**: Selected cards have primary border color
- **Badges**: "Selected" badges appear on chosen items
- **Sidebar Display**: Selected items shown in filters sidebar

### Loading Indicators
- **Skeleton Loaders**: Animated placeholders during loading
- **Progress Spinners**: For long-running operations
- **Status Messages**: Clear feedback on operation status

## 🚨 Troubleshooting

### Common Issues

#### "Select network first" Message
- **Cause**: No network selected
- **Solution**: Select a network from the dropdown

#### "No advertisers found"
- **Cause**: Network has no advertisers or data not synced
- **Solution**: Sync data or try different network

#### "No campaigns found"
- **Cause**: Advertiser has no campaigns or data not synced
- **Solution**: Sync data or try different advertiser

#### Filters Not Persisting
- **Cause**: Local storage disabled or cleared
- **Solution**: Check browser settings, filters will reset

### Error Recovery
- **Invalid Data**: Automatically clears invalid filter selections
- **Network Errors**: Shows retry options for failed data loads
- **Sync Issues**: Provides clear error messages and solutions

## 💡 Best Practices

### Filter Management
1. **Start with Network**: Always select network first
2. **Use Clear Buttons**: Use × buttons to clear individual filters
3. **Check Data Freshness**: Ensure data is synced before filtering
4. **Document Selections**: Note important filter combinations

### Source of Truth for Actions
- **Sidebar Drives Actions**: All operations that depend on context (e.g., syncing to Broadstreet, creating placements) must use the selections from the sidebar filters as the single source of truth.
- **No Guessing From Data**: Do not infer `networkId` or related context from visible page data; read it from `FilterContext.selectedNetwork` (and other selected items) instead.
- **Persistence**: Because the sidebar persists selections in localStorage, actions can reliably access the same context across pages and sessions.
- **Example**: `POST /api/sync/local-all` should send `{ networkId: selectedNetwork.id }` derived from `FilterContext`, not from entity lists.

### Request Payload Policy
- **Required-Only**: Client requests must include only the fields required by the API and only when they are populated.
- **No Empty Fields**: Never send empty strings, nulls, or undefined values in payloads. Omit fields instead.
- **Body Required When Specified**: Endpoints that require a JSON body (e.g., `POST /api/sync/local-all`) must receive it; the server will reject requests without the required body fields.

### Performance Tips
1. **Limit Selections**: Don't select unnecessary filters
2. **Clear When Done**: Clear filters when switching contexts
3. **Use Clear All**: Use "Clear All" for quick reset
4. **Monitor Loading**: Watch for loading states and errors

## 🔮 Future Enhancements

### Planned Features
- **Saved Filter Sets**: Save and restore filter combinations
- **Filter History**: Quick access to recently used filters
- **Advanced Filters**: Date ranges, status filters, custom criteria
- **Filter Sharing**: Share filter combinations with team members
- **Bulk Operations**: Apply operations to filtered data sets

---

*For specific page filtering behavior, see the [User Guide](./user-guide.md)*
