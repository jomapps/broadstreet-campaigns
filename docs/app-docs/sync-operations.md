# Sync Operations Guide

## 🎯 Overview

Sync operations keep your local data synchronized with the Broadstreet API. This ensures you always have the latest information about networks, advertisers, campaigns, zones, and advertisements.

## 🔄 Types of Sync Operations

### 1. Network Sync
- **Purpose**: Update network information and status
- **Data Updated**: Network details, valet status, zone counts
- **Frequency**: As needed or when network changes occur
- **Location**: Networks page sync button

### 2. Advertiser Sync
- **Purpose**: Refresh advertiser information and details
- **Data Updated**: Company details, logos, admin contacts
- **Frequency**: When advertiser information changes
- **Location**: Advertisers page sync button

### 3. Campaign Sync
- **Purpose**: Update campaign data and status
- **Data Updated**: Campaign details, dates, performance metrics
- **Frequency**: Regular intervals or when campaigns change
- **Location**: Campaigns page sync button

### 4. Zone Sync
- **Purpose**: Refresh zone information and availability
- **Data Updated**: Zone details, sizes, network associations
- **Frequency**: When zone configurations change
- **Location**: Zones page sync button

### 5. Advertisement Sync
- **Purpose**: Update ad creative information
- **Data Updated**: Ad details, previews, status information
- **Frequency**: When new ads are added or existing ones updated
- **Location**: Advertisements page sync button

### 6. All Data Sync
- **Purpose**: Synchronize all data types at once
- **Data Updated**: Networks, advertisers, campaigns, zones, advertisements
- **Frequency**: Initial setup or major data refresh
- **Location**: Dashboard or individual page sync buttons

## 🚀 How to Perform Sync Operations

### Individual Sync Operations

#### Network Sync
1. **Navigate to Networks Page**: Go to `/networks`
2. **Locate Sync Button**: Find the sync button in the page header
3. **Click Sync**: Click the network sync button
4. **Monitor Progress**: Watch for completion and any errors
5. **Verify Results**: Check that network data was updated

#### Advertiser Sync
1. **Navigate to Advertisers Page**: Go to `/advertisers`
2. **Locate Sync Button**: Find the sync button in the page header
3. **Click Sync**: Click the advertiser sync button
4. **Monitor Progress**: Watch for completion and any errors
5. **Verify Results**: Check that advertiser data was updated

#### Campaign Sync
1. **Navigate to Campaigns Page**: Go to `/campaigns`
2. **Locate Sync Button**: Find the sync button in the page header
3. **Click Sync**: Click the campaign sync button
4. **Monitor Progress**: Watch for completion and any errors
5. **Verify Results**: Check that campaign data was updated

#### Zone Sync
1. **Navigate to Zones Page**: Go to `/zones`
2. **Locate Sync Button**: Find the sync button in the page header
3. **Click Sync**: Click the zone sync button
4. **Monitor Progress**: Watch for completion and any errors
5. **Verify Results**: Check that zone data was updated

#### Advertisement Sync
1. **Navigate to Advertisements Page**: Go to `/advertisements`
2. **Locate Sync Button**: Find the sync button in the page header
3. **Click Sync**: Click the advertisement sync button
4. **Monitor Progress**: Watch for completion and any errors
5. **Verify Results**: Check that advertisement data was updated

### Bulk Sync Operations

#### Sync All Data
1. **Navigate to Dashboard**: Go to the main dashboard
2. **Locate Sync All Button**: Find the sync all button
3. **Click Sync All**: Click to sync all data types
4. **Monitor Progress**: Watch progress for each data type
5. **Review Results**: Check summary of all sync operations

## 📊 Sync Process Details

### API Communication
```
Local App → Broadstreet API → Data Processing → Database Update
```

### Data Flow
1. **API Request**: Send request to Broadstreet API endpoint
2. **Data Retrieval**: Fetch latest data from API
3. **Data Processing**: Parse and validate received data
4. **Database Update**: Update local MongoDB database
5. **UI Refresh**: Update user interface with new data

### Error Handling
- **Network Errors**: Automatic retry with exponential backoff
- **API Errors**: Clear error messages with suggested solutions
- **Data Validation**: Validation of received data before storage
- **Partial Failures**: Continue processing other data types

## ⏱️ Sync Timing and Frequency

### Recommended Frequencies
- **Networks**: Weekly or when network changes occur
- **Advertisers**: Weekly or when advertiser information changes
- **Campaigns**: Daily or when campaign status changes
- **Zones**: Weekly or when zone configurations change
- **Advertisements**: Daily or when new ads are added
- **All Data**: Weekly or during initial setup

### Best Practices
- **Regular Schedule**: Set up regular sync schedule
- **Before Important Operations**: Sync before using utilities
- **After Data Changes**: Sync after making changes in Broadstreet
- **Monitor Status**: Watch for sync errors and address promptly

## 🎨 User Interface

### Sync Button States
- **Default**: Ready to sync
- **Loading**: Sync in progress (spinner animation)
- **Success**: Sync completed successfully (green checkmark)
- **Error**: Sync failed (red X with error message)

### Progress Indicators
- **Individual Sync**: Progress bar for single operation
- **Bulk Sync**: Progress bars for each data type
- **Status Messages**: Clear feedback on operation status
- **Error Details**: Detailed error information when sync fails

### Visual Feedback
```
🔄 Syncing networks... (Progress: 75%)
✅ Networks synced successfully (Updated: 12 networks)
❌ Advertiser sync failed (Error: API timeout)
```

## 🚨 Troubleshooting Sync Issues

### Common Problems

#### Sync Fails Immediately
- **Cause**: Network connectivity issues
- **Solution**: Check internet connection and try again
- **Prevention**: Monitor network status regularly

#### Partial Sync Success
- **Cause**: Some API endpoints unavailable
- **Solution**: Retry failed operations individually
- **Prevention**: Check Broadstreet API status

#### Data Not Updating
- **Cause**: Sync completed but UI not refreshed
- **Solution**: Refresh page or navigate away and back
- **Prevention**: Monitor sync completion messages

#### Slow Sync Performance
- **Cause**: Large datasets or slow API response
- **Solution**: Wait for completion or try individual syncs
- **Prevention**: Schedule syncs during off-peak hours

### Error Messages and Solutions

#### "API Connection Failed"
- **Cause**: Cannot reach Broadstreet API
- **Solution**: Check internet connection and API status
- **Prevention**: Monitor API health regularly

#### "Authentication Error"
- **Cause**: Invalid API credentials
- **Solution**: Verify API key configuration
- **Prevention**: Regularly check credential validity

#### "Data Validation Error"
- **Cause**: Received data doesn't match expected format
- **Solution**: Contact support with error details
- **Prevention**: Monitor API changes and updates

#### "Database Update Failed"
- **Cause**: Local database issues
- **Solution**: Check database connection and retry
- **Prevention**: Regular database maintenance

## 📈 Monitoring and Maintenance

### Sync Status Monitoring
- **Dashboard Overview**: Check overall sync status
- **Individual Page Status**: Monitor specific data type sync status
- **Error Logs**: Review sync error history
- **Performance Metrics**: Track sync duration and success rates

### Maintenance Tasks
- **Regular Syncs**: Schedule regular data synchronization
- **Error Review**: Check and address sync errors
- **Performance Monitoring**: Track sync performance over time
- **Data Validation**: Verify data integrity after syncs

### Best Practices
1. **Schedule Regular Syncs**: Set up automated sync schedule
2. **Monitor Sync Status**: Check sync status regularly
3. **Address Errors Promptly**: Fix sync issues quickly
4. **Document Issues**: Record sync problems and solutions
5. **Test After Changes**: Verify syncs after system updates

## 🔗 Related Documentation

- [User Guide](./user-guide.md) - General application usage
- [API Reference](./api-reference.md) - Technical API details
- [Data Models](./data-models.md) - Understanding data structure
- [Utilities Guide](./utilities-guide.md) - Using sync with utilities

---

*For technical implementation details, see the [API Reference](./api-reference.md)*
