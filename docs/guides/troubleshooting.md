# Troubleshooting Guide

**Application**: Broadstreet Campaigns  
**Purpose**: Common issues and solutions for users and developers  

## 🚨 Quick Fixes

### **Application Won't Start**
```bash
# Check environment variables
node -e "
console.log('MongoDB URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Missing');
console.log('API Token:', process.env.BROADSTREET_API_TOKEN ? '✅ Set' : '❌ Missing');
"

# Start with verbose logging
npm run dev
```

### **Can't Create Entities**
1. **Check sidebar filters** - Network/Advertiser must be selected
2. **Verify required fields** - Name is always required
3. **Check browser console** for JavaScript errors
4. **Test API connection** via Network tab in developer tools

### **Sync Failures**
1. **Check API credentials** in environment variables
2. **Verify Broadstreet API** status via direct API call
3. **Check for name conflicts** in existing entities
4. **Review dependency order** (Networks → Advertisers → Campaigns)

## 🔧 Environment Issues

### **MongoDB Connection Failed**

**Symptoms:**
- Application logs show MongoDB connection errors
- Pages show "Database connection failed"
- Entity lists are empty

**Solutions:**
```bash
# 1. Check MongoDB service status
brew services list | grep mongodb     # macOS
sudo systemctl status mongod         # Linux
net start MongoDB                    # Windows

# 2. Test connection manually
mongosh "mongodb://localhost:27017/broadstreet-campaigns"

# 3. Check environment variable
echo $MONGODB_URI

# 4. Restart MongoDB service
brew services restart mongodb-community  # macOS
sudo systemctl restart mongod           # Linux
net stop MongoDB && net start MongoDB   # Windows
```

### **Broadstreet API Authentication Failed**

**Symptoms:**
- API calls return 401 Unauthorized
- Sync operations fail immediately
- Console shows "Authentication failed" errors

**Solutions:**
```bash
# 1. Verify API token format
echo $BROADSTREET_API_TOKEN

# 2. Test token with curl
curl "https://api.broadstreetads.com/api/1/networks?access_token=$BROADSTREET_API_TOKEN"

# 3. Check for trailing spaces or invalid characters
BROADSTREET_API_TOKEN=$(echo $BROADSTREET_API_TOKEN | tr -d '[:space:]')

# 4. Request new token from Broadstreet
# Visit: https://my.broadstreetads.com/access-token
```

### **Port Already in Use**

**Symptoms:**
- `Error: listen EADDRINUSE :::3005`
- Development server fails to start

**Solutions:**
```bash
# 1. Find process using port 3005
lsof -i :3005                    # macOS/Linux
netstat -ano | findstr :3005     # Windows

# 2. Kill the process
kill -9 <PID>                    # macOS/Linux
taskkill /PID <PID> /F           # Windows

# 3. Use different port
npm run dev -- -p 3006

# 4. Update package.json if needed
"dev": "next dev -p 3006"
```

## 📊 Data Issues

### **Entities Not Appearing**

**Symptoms:**
- Entity lists show empty state
- Recently created entities missing
- Sync completed but no data visible

**Debugging Steps:**
```bash
# 1. Check database directly
mongosh "mongodb://localhost:27017/broadstreet-campaigns"
db.advertisers.countDocuments()
db.local_advertisers.countDocuments()

# 2. Verify filter state
# Open browser developer tools → Application → Local Storage
# Check for filter settings

# 3. Test API endpoints
curl http://localhost:3005/api/advertisers

# 4. Check server logs for errors
tail -f .next/trace | grep ERROR
```

### **Duplicate Entities After Sync**

**Symptoms:**
- Same entity appears multiple times
- Sync creates duplicates instead of updating

**Solutions:**
```javascript
// 1. Clear duplicate entities (run in MongoDB shell)
db.advertisers.aggregate([
  { $group: { _id: "$name", count: { $sum: 1 }, docs: { $push: "$_id" } } },
  { $match: { count: { $gt: 1 } } }
]).forEach(group => {
  group.docs.slice(1).forEach(id => db.advertisers.deleteOne({_id: id}));
});

// 2. Run fresh sync
// Navigate to /local-only → Sync All

// 3. Implement unique indexes (if needed)
db.advertisers.createIndex({ "name": 1, "network_id": 1 }, { unique: true });
```

### **Local Entities Not Syncing**

**Symptoms:**
- Local entities remain in Local Only dashboard
- Sync appears successful but entities don't move
- No error messages visible

**Debugging:**
```bash
# 1. Check local entity status
mongosh "mongodb://localhost:27017/broadstreet-campaigns"
db.local_advertisers.find({}, {name: 1, sync_errors: 1, last_sync_attempt: 1})

# 2. Review sync logs
# Check browser console during sync operation

# 3. Test individual entity sync
# Create single test entity and sync individually

# 4. Verify API payload format
# Check network tab in browser developer tools
```

## 🎨 UI/UX Issues

### **Forms Not Submitting**

**Symptoms:**
- Create button doesn't respond
- Form validation errors persist
- Modal doesn't close after submission

**Solutions:**
```javascript
// 1. Check browser console for JavaScript errors
// Open Developer Tools → Console

// 2. Verify form validation
// All required fields (marked with *) must be filled

// 3. Check network requests
// Developer Tools → Network → Look for failed API calls

// 4. Clear browser cache
// Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

### **Filters Not Working**

**Symptoms:**
- Selecting filters doesn't update entity lists
- Filter state resets on page navigation
- No entities shown despite filter selection

**Solutions:**
```javascript
// 1. Clear filter state
localStorage.removeItem('broadstreet-filters');
location.reload();

// 2. Check filter context
// Verify FilterContext is properly wrapped around components

// 3. Test filter API endpoints
fetch('/api/advertisers?network_id=1')
  .then(r => r.json())
  .then(console.log);

// 4. Check for JavaScript errors in filter components
```

### **Local Entity Styling Missing**

**Symptoms:**
- Local entities look the same as synced entities
- Orange styling not applied
- Local badges not showing

**Solutions:**
```javascript
// 1. Check entity data structure
console.log('Entity:', entity);
// Should have: created_locally: true, synced_with_api: false

// 2. Verify styling classes
// Check if Tailwind CSS classes are properly applied

// 3. Clear CSS cache
// Hard refresh and check for build errors

// 4. Test with known local entity
// Create new entity and verify styling immediately
```

## 🔄 Sync Problems

### **Name Conflict Errors**

**Symptoms:**
- Sync fails with "name already exists" errors
- Certain entities won't sync
- Partial sync completion

**Solutions:**
```javascript
// 1. Manual conflict resolution
// Rename conflicting local entities

// 2. Check existing Broadstreet entities
// Use Broadstreet dashboard to verify names

// 3. Enable automatic conflict resolution
// Update sync code to append "(1)", "(2)" suffixes

// 4. Clean up duplicate names
db.local_advertisers.find({name: "Duplicate Name"}).forEach(
  (doc, index) => {
    if (index > 0) {
      db.local_advertisers.updateOne(
        {_id: doc._id}, 
        {$set: {name: `${doc.name} (${index})`}}
      );
    }
  }
);
```

### **Dependency Resolution Failures**

**Symptoms:**
- Campaigns sync before advertisers
- Zones reference non-existent networks
- ID mapping errors in sync process

**Solutions:**
```javascript
// 1. Verify sync order
const correctOrder = ['networks', 'advertisers', 'zones', 'advertisements', 'campaigns'];

// 2. Check ID mapping
console.log('Network ID Map:', networkIdMap);
console.log('Advertiser ID Map:', advertiserIdMap);

// 3. Manually sync in correct order
await syncNetworks();
await syncAdvertisers();
await syncZones();
await syncCampaigns();

// 4. Verify parent entities exist
db.advertisers.find({network_id: {$exists: false}});
```

### **API Rate Limiting**

**Symptoms:**
- Sync operations slow down significantly
- 429 "Too Many Requests" errors
- Partial sync completion

**Solutions:**
```javascript
// 1. Implement delays between requests
await new Promise(resolve => setTimeout(resolve, 1000));

// 2. Reduce batch sizes
const batchSize = 3; // Instead of 10

// 3. Monitor rate limit headers
console.log('Rate limit remaining:', response.headers['x-ratelimit-remaining']);

// 4. Retry with exponential backoff
const retryWithBackoff = async (operation, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (error.status === 429 && i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        continue;
      }
      throw error;
    }
  }
};
```

## 🧪 Testing Issues

### **Playwright Tests Failing**

**Symptoms:**
- Tests timeout or fail to start
- Elements not found
- Test data inconsistencies

**Solutions:**
```bash
# 1. Update Playwright
npm update @playwright/test

# 2. Install browsers
npx playwright install

# 3. Run tests in headed mode for debugging
npm run test:headed

# 4. Check test environment
# Ensure test database is separate from development
```

### **Test Data Cleanup**

**Symptoms:**
- Tests interfere with each other
- Stale test data affects results
- Inconsistent test outcomes

**Solutions:**
```javascript
// 1. Implement test cleanup
afterEach(async () => {
  await TestUtils.clearTestData();
});

// 2. Use test-specific prefixes
const testName = `Test Entity ${Date.now()}`;

// 3. Clean up specific test data
npm run delete:zone-by-name "Test Zone Name"

// 4. Reset database between test runs
beforeAll(async () => {
  await mongoose.connection.dropDatabase();
});
```

## 📱 Browser-Specific Issues

### **Safari Compatibility**

**Solutions:**
- Update Safari to latest version
- Check for CSS Grid/Flexbox issues
- Verify fetch API polyfills

### **Mobile Device Issues**

**Solutions:**
- Test responsive breakpoints
- Check touch interaction handling
- Verify mobile-specific CSS

### **Internet Explorer / Edge Legacy**

**Solutions:**
- Use modern browser recommendations
- Implement polyfills if needed
- Consider feature detection

## 🔍 Debug Tools and Commands

### **Database Queries**
```javascript
// Check entity counts
db.runCommand({collStats: "advertisers"});
db.runCommand({collStats: "local_advertisers"});

// Find entities with sync errors
db.local_advertisers.find({sync_errors: {$exists: true}});

// Check recent entities
db.advertisers.find().sort({created_at: -1}).limit(5);
```

### **API Testing**
```bash
# Test individual endpoints
curl http://localhost:3005/api/networks
curl http://localhost:3005/api/advertisers?network_id=1
curl http://localhost:3005/api/local-entities

# Test external API
curl "https://api.broadstreetads.com/api/1/networks?access_token=YOUR_TOKEN"
```

### **Log Analysis**
```bash
# Application logs
tail -f .next/trace

# MongoDB logs
tail -f /var/log/mongodb/mongod.log

# System logs
journalctl -u mongod -f
```

## 📞 Getting Help

### **Check These First**
1. **Environment variables** are set correctly
2. **Network connection** is stable
3. **Services are running** (MongoDB, Node.js)
4. **Browser cache** is cleared
5. **Latest code** is pulled from repository

### **Useful Commands for Support**
```bash
# System information
node --version
npm --version
mongosh --version

# Environment check
npm run dev 2>&1 | head -20

# Database status
mongosh --eval "db.adminCommand('ismaster')"

# Test API connectivity
curl -I https://api.broadstreetads.com/api/1/networks
```

### **What to Include When Asking for Help**
1. **Error messages** (exact text)
2. **Browser console** output
3. **Steps to reproduce** the issue
4. **Environment details** (OS, browser, versions)
5. **Recent changes** made to code or configuration

---

**Remember**: Most issues are related to environment configuration or API connectivity. Always check the basics first before diving into complex debugging.
