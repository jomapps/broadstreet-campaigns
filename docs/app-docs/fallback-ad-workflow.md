# Fallback Ad Workflow

## 🎯 Overview

The Fallback Ad Creation utility automates the process of creating backup ad placements for campaigns. This ensures continuous ad delivery even when primary ads are unavailable or underperforming.

## 🚀 Quick Start

1. **Set Filters**: Select your desired network, advertiser, and campaign
2. **Access Utility**: Click "Create Fallback Ad" in the sidebar utilities
3. **Configure**: Choose ad sizes and placement options
4. **Execute**: Run the fallback ad creation process
5. **Review**: Check the created placements and results

## 📋 Prerequisites

### Required Filters
- **Network**: Must be selected (determines available zones)
- **Advertiser**: Must be selected (determines available campaigns)
- **Campaign**: Must be selected (target campaign for fallback ads)

### Data Requirements
- **Zones**: Available zones in the selected network
- **Advertisements**: Existing ads for the selected advertiser
- **Campaign Data**: Active campaign with proper configuration

## 🔄 Step-by-Step Workflow

### Step 1: Filter Setup
```
1. Navigate to Networks page
2. Select desired network from sidebar filters
3. Go to Advertisers page
4. Select desired advertiser (checkbox)
5. Go to Campaigns page
6. Select desired campaign (checkbox)
```

### Step 2: Access Utility
```
1. Ensure sidebar is expanded
2. Locate "Utilities" card
3. Click "Create Fallback Ad" button
4. Utility wizard will open
```

### Step 3: Configuration
```
1. Review selected network, advertiser, and campaign
2. Choose advertisement sizes (SQ, PT, LS)
3. Select placement options:
   - Home page zones only
   - All available zones
   - Specific zone categories
4. Set placement restrictions (optional)
```

### Step 4: Execution
```
1. Click "Create Fallback Ads" button
2. Monitor progress indicator
3. Wait for completion (may take 30-60 seconds)
4. Review success/error messages
```

### Step 5: Review Results
```
1. Check created placements count
2. Review matched zones
3. Verify placement restrictions
4. Note any warnings or errors
```

## 📊 Expected Results

### Successful Creation
- **Placements Created**: Number of new fallback placements
- **Zones Matched**: List of zones where ads were placed
- **Advertisements Used**: Which ads were selected for fallback
- **Restrictions Applied**: Any placement limitations

### Example Output
```
✅ Fallback Ads Created Successfully

📊 Summary:
- Placements Created: 12
- Zones Matched: 8
- Advertisements Used: 3
- Restrictions Applied: Home page zones only

🎯 Created Placements:
- Zone: Home Banner (728x90)
- Zone: Home Sidebar (300x250)
- Zone: Home Footer (728x90)
- ... (9 more placements)
```

## ⚠️ Common Scenarios

### Scenario 1: No Available Zones
**Problem**: No zones found for the selected network
**Solution**: 
- Check if network has active zones
- Verify zone data is synced
- Try a different network

### Scenario 2: No Suitable Advertisements
**Problem**: No ads available for the selected advertiser
**Solution**:
- Check advertiser's ad inventory
- Sync advertisement data
- Select different advertiser

### Scenario 3: Campaign Already Has Fallback Ads
**Problem**: Campaign already has fallback placements
**Solution**:
- Review existing placements
- Decide whether to add more or replace existing
- Use placement management tools

## 🔧 Advanced Configuration

### Zone Size Selection
- **SQ (Square)**: 300x300, 250x250 ads
- **PT (Portrait)**: 300x600, 160x600 ads  
- **LS (Landscape)**: 728x90, 970x250 ads

### Placement Restrictions
- **Geographic**: Limit to specific regions
- **Time-based**: Schedule placement times
- **Category-based**: Target specific content categories
- **Device-based**: Mobile, desktop, or tablet only

### Ad Selection Criteria
- **Performance-based**: Select best-performing ads
- **Recency-based**: Use most recently updated ads
- **Manual selection**: Choose specific advertisements
- **Random selection**: Distribute across available ads

## 📈 Best Practices

### Before Creation
1. **Verify Campaign Status**: Ensure campaign is active
2. **Check Zone Availability**: Confirm zones are available
3. **Review Ad Inventory**: Verify sufficient ad creatives
4. **Plan Placement Strategy**: Decide on size and restriction preferences

### During Creation
1. **Monitor Progress**: Watch for any error messages
2. **Don't Interrupt**: Let the process complete fully
3. **Note Warnings**: Pay attention to any placement warnings
4. **Document Settings**: Record configuration choices

### After Creation
1. **Verify Placements**: Check that placements were created correctly
2. **Test Delivery**: Ensure ads are delivering properly
3. **Monitor Performance**: Track fallback ad performance
4. **Update Documentation**: Record what was created

## 🚨 Troubleshooting

### Error: "No zones available"
- **Cause**: Network has no active zones
- **Solution**: Sync zone data or select different network

### Error: "No advertisements found"
- **Cause**: Advertiser has no available ads
- **Solution**: Sync advertisement data or select different advertiser

### Error: "Campaign not found"
- **Cause**: Campaign may be inactive or deleted
- **Solution**: Verify campaign status or select different campaign

### Warning: "Some zones skipped"
- **Cause**: Zones don't match selected size criteria
- **Solution**: Review zone sizes and adjust selection criteria

## 📊 Monitoring & Maintenance

### Regular Checks
- **Placement Status**: Verify fallback ads are active
- **Performance Metrics**: Monitor delivery and click rates
- **Zone Availability**: Ensure zones remain active
- **Ad Creative Status**: Check that ads are still valid

### Updates & Changes
- **Add New Fallback Ads**: Create additional fallback placements
- **Remove Old Placements**: Clean up unused fallback ads
- **Update Restrictions**: Modify placement criteria
- **Refresh Ad Selection**: Update to newer ad creatives

## 🔗 Related Documentation

- [Utilities Guide](./utilities-guide.md) - General utility information
- [Filter System](./filter-system.md) - How to set up filters
- [API Reference](./api-reference.md) - Technical API details
- [Data Models](./data-models.md) - Understanding the data structure

---

*For technical implementation details, see the [API Reference](./api-reference.md)*
