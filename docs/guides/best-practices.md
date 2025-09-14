# Best Practices Guide

**Application**: Broadstreet Campaigns  
**Purpose**: Essential patterns and practices for this unique application  

## 🎯 Application-Specific Requirements

### **1. Real API Integration Only**

**Critical Rule**: This application operates exclusively with real Broadstreet API integration.

```typescript
// ✅ REQUIRED: Real API calls only
const result = await broadstreetAPI.createAdvertiser(payload);

// ❌ FORBIDDEN: No mock data, test IDs, or fallbacks
const mockData = { id: 123, name: "Test" }; // NEVER DO THIS
```

**Implementation Requirements:**
- All API credentials must be properly configured in environment variables
- No hardcoded IDs, test data, or fallback values
- Proper environment validation before operations
- Comprehensive error handling for API failures without fallbacks

### **2. Local Entity Management Pattern**

**Core Concept**: Entities are created locally first, then synced to Broadstreet API.

```typescript
// ✅ CORRECT: Separate collections for local entities
const localAdvertiser = await LocalAdvertiser.create({
  name: "New Advertiser",
  network_id: networkId,
  created_locally: true,
  synced_with_api: false
});

// ❌ INCORRECT: Direct API creation without local storage
const result = await broadstreetAPI.createAdvertiser(data); // Missing local tracking
```

**Requirements:**
- Use separate `local_*` collections for locally created entities
- Visual distinction between local and synced entities
- Preserve local entities until API confirmation
- Track sync status with proper timestamps

### **3. Clean API Payload Construction**

**Critical Pattern**: Only send defined values to prevent API rejection.

```typescript
// ✅ CORRECT: Clean payload with only defined values
const payload = {
  name: entity.name,
  network_id: entity.network_id
};

// Only add optional fields if they have actual values
if (entity.web_home_url && entity.web_home_url.trim()) {
  payload.web_home_url = entity.web_home_url.trim();
}
if (entity.notes && entity.notes.trim()) {
  payload.notes = entity.notes.trim();
}

// ❌ INCORRECT: Sending undefined/null values
const payload = {
  name: entity.name,
  web_home_url: entity.web_home_url, // undefined = API rejection
  notes: entity.notes // undefined = API rejection
};
```

### **4. Hierarchical Sync Dependencies**

**Required Order**: Sync entities in dependency order to prevent failures.

```typescript
// ✅ CORRECT: Hierarchical sync order
const syncOrder = [
  'networks',     // No dependencies
  'advertisers',  // Depend on networks
  'zones',        // Depend on networks
  'advertisements', // Depend on networks, advertisers
  'campaigns'     // Depend on advertisers
];

// ❌ INCORRECT: Random sync order
await syncCampaigns(); // Will fail if advertisers don't exist
await syncAdvertisers(); // Should happen first
```

**Implementation:**
- Always sync in dependency order
- Map local IDs to API IDs during sync
- Handle dependency resolution automatically
- Validate dependencies before sync attempts

### **5. Minimal Required Fields UI Pattern**

**Core Principle**: Only essential fields are required, everything else is optional and collapsible.

```tsx
// ✅ CORRECT: Minimal required fields
<form>
  {/* Required fields at top - always visible */}
  <div className="mb-6">
    <Label htmlFor="name">Name *</Label>
    <Input id="name" required value={name} onChange={setName} />
  </div>

  {/* Optional fields in collapsible sections */}
  <CollapsibleSection title="Basic Settings" sectionKey="basic">
    <Label htmlFor="website">Website URL</Label>
    <Input id="website" value={website} onChange={setWebsite} />
  </CollapsibleSection>
</form>

// ❌ INCORRECT: All fields visible and required
<form>
  <Input required /> {/* Too many required fields */}
  <Input required />
  <Input required />
  <Input required />
</form>
```

**UI Requirements:**
- Dual submit buttons (top and bottom)
- Auto-adjusting modal height
- Empty optional fields by default
- Clear visual hierarchy
- Real-time validation

## 🛠️ Technical Implementation Patterns

### **Database Operations**

```typescript
// ✅ CORRECT: Entity lifecycle management
const createLocalEntity = async (data) => {
  // 1. Create in local collection
  const localEntity = await LocalAdvertiser.create({
    ...data,
    created_locally: true,
    synced_with_api: false,
    created_at: new Date()
  });

  // 2. Return with sync status
  return { ...localEntity.toJSON(), sync_status: 'local' };
};

const syncEntityToAPI = async (localEntity) => {
  try {
    // 3. Sync to API with clean payload
    const apiResult = await broadstreetAPI.createAdvertiser(cleanPayload);
    
    // 4. Move to main collection
    await Advertiser.create({
      ...localEntity,
      id: apiResult.id,
      synced_with_api: true,
      synced_at: new Date()
    });
    
    // 5. Remove from local collection
    await LocalAdvertiser.findByIdAndDelete(localEntity._id);
    
  } catch (error) {
    // Keep in local collection with error tracking
    await LocalAdvertiser.findByIdAndUpdate(localEntity._id, {
      sync_errors: [error.message],
      last_sync_attempt: new Date()
    });
    throw error;
  }
};
```

### **Error Handling Patterns**

```typescript
// ✅ CORRECT: Comprehensive error handling
const handleAPIOperation = async (operation) => {
  try {
    const result = await operation();
    return { success: true, data: result };
  } catch (error) {
    console.error('API Operation failed:', error);
    
    // Categorize errors
    if (error.response?.status === 422) {
      return { success: false, error: 'Validation failed', details: error.response.data };
    } else if (error.response?.status === 401) {
      return { success: false, error: 'Authentication failed' };
    } else {
      return { success: false, error: 'Network error', details: error.message };
    }
  }
};

// ❌ INCORRECT: Silent failures or generic errors
try {
  await operation();
} catch (error) {
  // Silent failure - user has no feedback
}
```

### **Component Patterns**

```tsx
// ✅ CORRECT: Server-side component with client interactions
const EntitiesPage = async () => {
  // Server-side data fetching
  const entities = await getEntities();
  
  return (
    <div>
      <EntitiesHeader />
      <EntitiesList entities={entities} />
      <ClientInteractionWrapper>
        <CreateButton />
      </ClientInteractionWrapper>
    </div>
  );
};

// ❌ INCORRECT: Unnecessary client components
'use client';
const EntitiesPage = () => {
  const [entities, setEntities] = useState([]);
  // Client-side fetching when server-side would work
};
```

## 🎨 UI/UX Requirements

### **Visual Entity Distinction**

```tsx
// ✅ CORRECT: Clear local vs synced entity styling
const EntityCard = ({ entity, isLocal }) => (
  <div className={cn(
    "rounded-lg border shadow-sm",
    isLocal
      ? "bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-400 shadow-orange-200"
      : "bg-white border-gray-200"
  )}>
    {isLocal && (
      <Badge className="bg-orange-500 text-white">
        🏠 Local
      </Badge>
    )}
    {/* Entity content */}
  </div>
);

// ❌ INCORRECT: No visual distinction
const EntityCard = ({ entity }) => (
  <div className="bg-white border border-gray-200">
    {/* Same styling for all entities */}
  </div>
);
```

### **Form Validation Patterns**

```tsx
// ✅ CORRECT: Real-time validation with user feedback
const [errors, setErrors] = useState({});

const validateField = (name, value) => {
  const newErrors = { ...errors };
  
  if (name === 'name' && !value.trim()) {
    newErrors.name = 'Name is required';
  } else if (name === 'email' && value && !isValidEmail(value)) {
    newErrors.email = 'Please enter a valid email';
  } else {
    delete newErrors[name];
  }
  
  setErrors(newErrors);
};

// ❌ INCORRECT: Validation only on submit
const validateOnSubmit = (data) => {
  // Too late - user has no real-time feedback
};
```

## 🔄 Sync System Best Practices

### **Name Conflict Resolution**

```typescript
// ✅ CORRECT: Automatic name conflict resolution
const resolveNameConflicts = async (entities, entityType) => {
  const resolvedNames = new Map();
  
  for (const entity of entities) {
    let uniqueName = entity.name;
    let counter = 1;
    
    // Check if name exists in API
    while (await checkEntityExists(uniqueName, entityType)) {
      uniqueName = `${entity.name} (${counter})`;
      counter++;
    }
    
    if (uniqueName !== entity.name) {
      resolvedNames.set(entity.name, uniqueName);
      console.log(`Resolved name conflict: "${entity.name}" → "${uniqueName}"`);
    }
  }
  
  return resolvedNames;
};

// ❌ INCORRECT: No conflict resolution
const syncEntity = async (entity) => {
  // Sync without checking for existing names - will fail
  await broadstreetAPI.createEntity(entity);
};
```

### **Dependency Mapping**

```typescript
// ✅ CORRECT: ID mapping for dependencies
const syncWithDependencies = async () => {
  const idMaps = {
    networks: new Map(),
    advertisers: new Map(),
    zones: new Map()
  };
  
  // Sync networks first
  for (const network of localNetworks) {
    const apiNetwork = await broadstreetAPI.createNetwork(network);
    idMaps.networks.set(network._id.toString(), apiNetwork.id);
  }
  
  // Sync advertisers with network references
  for (const advertiser of localAdvertisers) {
    const payload = {
      name: advertiser.name,
      network_id: idMaps.networks.get(advertiser.network_id.toString())
    };
    const apiAdvertiser = await broadstreetAPI.createAdvertiser(payload);
    idMaps.advertisers.set(advertiser._id.toString(), apiAdvertiser.id);
  }
};

// ❌ INCORRECT: No dependency mapping
const syncAdvertiser = async (advertiser) => {
  // Using local network_id that doesn't exist in API
  await broadstreetAPI.createAdvertiser(advertiser);
};
```

## 🧪 Testing Requirements

### **Playwright Testing Patterns**

```typescript
// ✅ CORRECT: Comprehensive test flow
test('Entity creation and sync flow', async ({ page }) => {
  // 1. Navigate to entities page
  await page.goto('/advertisers');
  
  // 2. Create local entity
  await page.click('[data-testid="create-button"]');
  await page.fill('[data-testid="name-input"]', 'Test Advertiser');
  await page.click('[data-testid="submit-button"]');
  
  // 3. Verify local entity appears
  await expect(page.locator('[data-testid="local-entity"]')).toBeVisible();
  
  // 4. Test sync functionality
  await page.goto('/local-only');
  await page.click('[data-testid="sync-all-button"]');
  
  // 5. Verify sync success
  await expect(page.locator('[data-testid="sync-success"]')).toBeVisible();
});

// ❌ INCORRECT: Partial test coverage
test('Create entity', async ({ page }) => {
  await page.click('button');
  // Missing verification, sync testing, error handling
});
```

## 📊 Performance Considerations

### **Server-Side Component Optimization**

```tsx
// ✅ CORRECT: Efficient data fetching
const EntitiesPage = async ({ searchParams }) => {
  // Server-side filtering and pagination
  const entities = await getEntities({
    filter: searchParams.filter,
    page: searchParams.page || 1,
    limit: 20
  });
  
  return <EntitiesList entities={entities} />;
};

// ❌ INCORRECT: Client-side processing of large datasets
const EntitiesPage = () => {
  const [entities, setEntities] = useState([]);
  
  useEffect(() => {
    // Loading all data client-side - poor performance
    fetchAllEntities().then(setEntities);
  }, []);
  
  // Client-side filtering - inefficient
  const filteredEntities = entities.filter(/* filter logic */);
};
```

## 🚨 Common Pitfalls to Avoid

### **1. API Payload Issues**
- ❌ Sending undefined/null values
- ❌ Wrong data types (strings instead of numbers)
- ❌ Missing required fields
- ❌ Incorrect field names

### **2. Sync Order Problems**
- ❌ Syncing campaigns before advertisers
- ❌ Not mapping local IDs to API IDs
- ❌ Ignoring dependency relationships

### **3. UI Pattern Violations**
- ❌ Too many required fields
- ❌ No visual distinction for local entities
- ❌ Missing real-time validation
- ❌ No error handling feedback

### **4. Data Management Issues**
- ❌ Mixing local and synced entities
- ❌ Losing local entities during sync failures
- ❌ No audit trail for operations
- ❌ Inconsistent status tracking

## ✅ Checklist for New Features

When implementing new features, ensure:

- [ ] Real API integration (no mock data)
- [ ] Local entity management with separate collections
- [ ] Clean API payload construction
- [ ] Proper dependency handling
- [ ] Minimal required fields UI pattern
- [ ] Visual distinction for local vs synced entities
- [ ] Comprehensive error handling
- [ ] Real-time validation
- [ ] Playwright test coverage
- [ ] Documentation updates

## 🔧 Development Workflow

1. **Local Development**
   - Configure environment variables
   - Use real API credentials
   - Test with actual Broadstreet data

2. **Feature Implementation**
   - Follow established patterns
   - Implement comprehensive error handling
   - Add visual feedback for users

3. **Testing**
   - Write Playwright tests
   - Test sync functionality
   - Verify error scenarios

4. **Documentation**
   - Update relevant documentation
   - Add code examples
   - Document any new patterns

---

**Remember**: This application has unique requirements due to its dual local/API architecture. Always prioritize data integrity, user feedback, and real API integration.
