# Entity Management

**Feature**: Local Entity Creation and Management  
**Purpose**: Create and manage advertising entities locally before syncing to Broadstreet API  

## 🎯 Overview

The Entity Management system allows users to create advertising entities (networks, zones, advertisers, campaigns, advertisements) locally within the application. These entities are stored in separate local collections and can be managed independently before synchronizing with the Broadstreet API.

## 🏗️ Architecture

### **Dual Collection System**
```
Production Collections    Local Collections
├── networks           ←→ ├── local_networks
├── zones              ←→ ├── local_zones
├── advertisers        ←→ ├── local_advertisers
├── campaigns          ←→ ├── local_campaigns
└── advertisements     ←→ └── local_advertisements
```

### **Entity Lifecycle**
```
Creation → Local Storage → Sync Queue → API Sync → Production Collection
```

## 📝 Entity Types

### **Networks**
- **Purpose**: Website properties where ads are displayed
- **Examples**: Schwulissimo.de, TravelM.de
- **Key Fields**: name, web_home_url, logo
- **Dependencies**: None (root entity)

### **Zones**
- **Purpose**: Ad placement locations on websites
- **Examples**: "Homepage Banner", "Sidebar Square"
- **Key Fields**: name, network_id, alias, dimensions
- **Dependencies**: Networks

### **Advertisers**
- **Purpose**: Companies that run advertising campaigns
- **Examples**: "Local Restaurant", "Tourism Board"
- **Key Fields**: name, network_id, web_home_url, notes
- **Dependencies**: Networks

### **Campaigns**
- **Purpose**: Time-bound advertising initiatives
- **Examples**: "Summer Sale 2024", "Holiday Promotion"
- **Key Fields**: name, advertiser_id, start_date, end_date, weight
- **Dependencies**: Advertisers

### **Advertisements**
- **Purpose**: Creative content for campaigns
- **Examples**: Banner images, text ads, video content
- **Key Fields**: name, type, preview_url, destination_url
- **Dependencies**: Networks, Advertisers (indirect)

## 🎨 User Interface Patterns

### **Creation Button**
- **Location**: Floating Action Button (FAB) in top-right corner
- **Design**: Circular button with plus (+) icon
- **Context Aware**: Shows relevant entity type based on current page

### **Creation Modal Design**
```tsx
// Modal Structure
<Modal>
  {/* Top Submit Button */}
  <div className="flex justify-end mb-6">
    <Button type="submit">Create {EntityType}</Button>
  </div>

  {/* Required Fields - Always Visible */}
  <div className="mb-6">
    <Label htmlFor="name">Name *</Label>
    <Input id="name" required />
  </div>

  {/* Optional Fields - Collapsible Sections */}
  <CollapsibleSection title="Basic Settings">
    {/* Optional fields */}
  </CollapsibleSection>

  {/* Bottom Submit Button */}
  <div className="flex justify-end pt-4 border-t">
    <Button type="submit">Create {EntityType}</Button>
  </div>
</Modal>
```

### **Form Validation**
- **Real-time validation** with immediate feedback
- **Required field indicators** with asterisks
- **Error messages** below relevant fields
- **Success feedback** upon creation

## 🔧 Implementation Details

### **Local Entity Schema**
```typescript
interface LocalEntity {
  _id: ObjectId;              // MongoDB ObjectId
  name: string;               // Required: Entity name
  created_locally: boolean;   // Always true for local entities
  synced_with_api: boolean;   // false until synced
  created_at: Date;           // Creation timestamp
  synced_at?: Date;          // Sync timestamp (if synced)
  sync_errors?: string[];    // Sync error history
  // ... entity-specific fields
}
```

### **Entity Creation Process**
```typescript
const createEntity = async (entityData) => {
  // 1. Validate required fields
  const validation = validateEntityData(entityData);
  if (!validation.valid) {
    throw new ValidationError(validation.errors);
  }

  // 2. Create in local collection
  const localEntity = await LocalEntityModel.create({
    ...entityData,
    created_locally: true,
    synced_with_api: false,
    created_at: new Date()
  });

  // 3. Return with sync status
  return {
    success: true,
    data: localEntity,
    sync_status: 'local'
  };
};
```

### **Visual Distinction System**
```tsx
// Local Entity Styling
const EntityCard = ({ entity, isLocal }) => (
  <div className={cn(
    "rounded-lg border shadow-sm p-4",
    isLocal
      ? "bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-400"
      : "bg-white border-gray-200"
  )}>
    {isLocal && (
      <Badge className="bg-orange-500 text-white mb-2">
        🏠 Local
      </Badge>
    )}
    {/* Entity content */}
  </div>
);
```

## 📊 Entity-Specific Features

### **Advertiser Creation**
**Required Fields:**
- Name
- Network (pre-selected from filter)

**Optional Fields (Collapsible):**
- Website URL
- Notes
- Admin contacts (name/email pairs)

**Validation:**
- Name uniqueness within network
- Valid email format for admin contacts
- Valid URL format for website

### **Campaign Creation**
**Required Fields:**
- Name
- Network (pre-selected)
- Advertiser (pre-selected)
- Start Date (with smart time defaults)
- Weight (dropdown with predefined values)

**Optional Fields (Collapsible):**
- End Date
- Max impression count
- Display type, pacing type
- Notes

**Smart Defaults:**
- Start Date: 12:00 AM when date selected
- End Date: 11:59 PM when date selected
- Weight: Default (1)

### **Zone Creation**
**Required Fields:**
- Name
- Network (pre-selected)

**Optional Fields (Collapsible):**
- Advertisement count (default: 1)
- Allow duplicate ads (default: false)
- Display type (standard/rotation)
- Dimensions (width/height)
- Alias
- Custom CSS styles

**Size Detection:**
- Automatic categorization as SQ (Square), PT (Portrait), LS (Landscape)
- Based on zone name keywords and dimensions

### **Advertisement Creation**
**Status**: Backend Redirect
- Complex creation requires Broadstreet backend
- Modal directs users to log into Broadstreet
- Reminder to sync after creation

### **Network Creation**
**Status**: Backend Redirect
- Requires commercial contracts
- Modal directs users to Broadstreet backend
- Business process handling required

## 🔄 Local Only Dashboard

### **Purpose**
Centralized management interface for all locally created entities that haven't been synced to the Broadstreet API.

### **Location**
`/local-only` - accessible from main navigation

### **Features**

#### **Entity Sections**
- **Networks**: List of local networks with details
- **Zones**: Local zones with size detection and network association
- **Advertisers**: Local advertisers with company information
- **Campaigns**: Local campaigns with dates, weight, and advertiser info
- **Advertisements**: Local advertisements with type and preview info

#### **Management Actions**
```tsx
// Individual Entity Actions
<EntityCard>
  <DeleteButton onClick={() => deleteEntity(entity._id)} />
  <EntityDetails {...entity} />
</EntityCard>

// Batch Actions
<div className="mb-6 flex gap-4">
  <Button onClick={syncAllEntities} className="bg-blue-600">
    Sync All to Broadstreet API
  </Button>
  <Button onClick={deleteAllEntities} className="bg-red-600">
    Delete All Local Entities
  </Button>
</div>
```

#### **Visual Design**
- **Enhanced local styling** with orange gradients and borders
- **Entity type sections** with clear headers and counts
- **Empty states** with helpful guidance
- **Action confirmation** dialogs for destructive operations

## 🚨 Best Practices

### **Creation Guidelines**
1. **Minimal Required Fields**: Only essential fields are required
2. **Pre-populated Filters**: Use sidebar filter selections as defaults
3. **Clean Payloads**: Only send fields with actual values
4. **Real-time Validation**: Immediate feedback for user errors
5. **Success Feedback**: Clear confirmation of successful creation

### **Data Management**
1. **Local Preservation**: Keep local entities until API confirmation
2. **Sync Status Tracking**: Clear indication of sync state
3. **Error Handling**: Graceful handling of failures
4. **Audit Trail**: Track entity lifecycle events

### **User Experience**
1. **Visual Distinction**: Clear difference between local and synced entities
2. **Batch Operations**: Efficient management of multiple entities
3. **Contextual Actions**: Relevant actions based on entity state
4. **Progressive Disclosure**: Collapsible sections for optional fields

## 📊 Monitoring and Analytics

### **Entity Statistics**
```typescript
const getEntityStats = async () => {
  return {
    local: {
      networks: await LocalNetwork.countDocuments(),
      zones: await LocalZone.countDocuments(),
      advertisers: await LocalAdvertiser.countDocuments(),
      campaigns: await LocalCampaign.countDocuments(),
      advertisements: await LocalAdvertisement.countDocuments()
    },
    synced: {
      networks: await Network.countDocuments(),
      zones: await Zone.countDocuments(),
      advertisers: await Advertiser.countDocuments(),
      campaigns: await Campaign.countDocuments(),
      advertisements: await Advertisement.countDocuments()
    }
  };
};
```

### **Sync Performance Tracking**
- **Sync success rates** by entity type
- **Common sync failures** and resolution patterns
- **User adoption** of local creation vs direct API creation
- **Time to sync** metrics for planning

## 🔧 Troubleshooting

### **Common Issues**

**Entity Creation Fails**
- Check required field validation
- Verify network/advertiser filters are set
- Ensure unique names within scope

**Visual Styling Issues**
- Verify `isLocal` prop is passed correctly
- Check Tailwind CSS classes are applied
- Ensure local styling overrides are working

**Local Only Dashboard Empty**
- Verify local collections have data
- Check database connection
- Ensure proper query filtering

### **Debug Utilities**
```javascript
// Check local entity counts
db.local_advertisers.countDocuments()
db.local_campaigns.countDocuments()
db.local_zones.countDocuments()

// Find entities with sync errors
db.local_advertisers.find({ sync_errors: { $exists: true } })
```

---

**Next**: Continue with [Sync System](./sync-system.md) to understand how local entities are synchronized with the Broadstreet API.
