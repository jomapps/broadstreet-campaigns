# API Patterns and Best Practices

This document outlines common patterns, best practices, and implementation strategies for the Broadstreet API.

## Authentication Patterns

### API Key Management
```bash
# Store API key as environment variable
export BROADSTREET_API_KEY="your_api_key_here"

# Use in requests
curl "https://api.broadstreetads.com/v1/networks?api_key=$BROADSTREET_API_KEY"
```

### Security Best Practices
- **Never hardcode API keys** in source code
- Use environment variables or secure key management systems
- Rotate API keys regularly
- Restrict API key access to necessary IP addresses when possible

## Error Handling Patterns

### HTTP Status Codes
| Code | Meaning | Common Causes | Action |
|------|---------|---------------|---------|
| 200 | Success | Request completed successfully | Continue processing |
| 201 | Created | Resource created successfully | Use returned entity ID |
| 400 | Bad Request | Invalid parameters or request format | Check request syntax |
| 401 | Unauthorized | Invalid or missing API key | Verify authentication |
| 404 | Not Found | Resource doesn't exist or no access | Check ID and permissions |
| 422 | Unprocessable Entity | Validation failed | Review field requirements |
| 429 | Too Many Requests | Rate limit exceeded | Implement backoff strategy |

### Error Response Handling
```javascript
async function makeRequest(url, options) {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json();
      
      switch (response.status) {
        case 400:
          throw new Error(`Bad Request: ${errorData.message}`);
        case 401:
          throw new Error('Authentication failed. Check API key.');
        case 404:
          throw new Error('Resource not found or no access.');
        case 422:
          throw new Error(`Validation failed: ${JSON.stringify(errorData)}`);
        case 429:
          // Implement exponential backoff
          await delay(5000);
          return makeRequest(url, options);
        default:
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}
```

## Data Flow Patterns

### Entity Dependency Chain
```
Network → Zones + Advertisers → Advertisements + Campaigns → Placements
```

Always create entities in the correct order:
1. **Network** (if not exists)
2. **Zones** and **Advertisers** (can be parallel)
3. **Advertisements** and **Campaigns** (can be parallel)
4. **Placements** (requires all above)

### Validation Chain Pattern
```javascript
// Validate entities exist before creating dependent entities
async function createCampaignSafely(advertiserID, campaignData) {
  // 1. Verify advertiser exists
  const advertiser = await getAdvertiser(advertiserID);
  if (!advertiser) {
    throw new Error(`Advertiser ${advertiserID} not found`);
  }
  
  // 2. Validate dates
  if (new Date(campaignData.end_date) <= new Date(campaignData.start_date)) {
    throw new Error('End date must be after start date');
  }
  
  // 3. Create campaign
  return await createCampaign(advertiserID, campaignData);
}
```

## Rate Limiting Patterns

### Reporting Rate Limits (2 requests per 5 seconds)
```javascript
class RateLimitedReporter {
  constructor() {
    this.lastRequest = 0;
    this.minInterval = 2500; // 2.5 seconds
  }
  
  async makeReport(params) {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    
    if (timeSinceLastRequest < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastRequest;
      await this.delay(waitTime);
    }
    
    this.lastRequest = Date.now();
    return await this.fetchReport(params);
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Batch Processing Pattern
```javascript
async function processBatch(items, processor, batchSize = 5, delayMs = 2500) {
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    // Process batch in parallel
    const batchPromises = batch.map(processor);
    const batchResults = await Promise.allSettled(batchPromises);
    
    results.push(...batchResults);
    
    // Wait before next batch (except for last batch)
    if (i + batchSize < items.length) {
      await delay(delayMs);
    }
  }
  
  return results;
}
```

## Data Consistency Patterns

### Atomic Campaign Creation
```javascript
async function createCompleteCampaign({
  networkId,
  advertiserData,
  campaignData,
  advertisementData,
  zoneIds
}) {
  try {
    // 1. Create advertiser
    const advertiser = await createAdvertiser(networkId, advertiserData);
    
    // 2. Create advertisement
    const advertisement = await createAdvertisement(advertiser.id, advertisementData);
    
    // 3. Create campaign
    const campaign = await createCampaign(advertiser.id, campaignData);
    
    // 4. Create placements for all zones
    const placements = await Promise.all(
      zoneIds.map(zoneId => createPlacement({
        campaign_id: campaign.id,
        advertisement_id: advertisement.id,
        zone_id: zoneId
      }))
    );
    
    return {
      advertiser,
      advertisement,
      campaign,
      placements
    };
  } catch (error) {
    // Cleanup logic here if needed
    console.error('Campaign creation failed:', error);
    throw error;
  }
}
```

## Caching Patterns

### Entity Caching Strategy
```javascript
class BroadstreetCache {
  constructor(ttl = 300000) { // 5 minutes default TTL
    this.cache = new Map();
    this.ttl = ttl;
  }
  
  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }
  
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  // Cache network/advertiser/zone lookups
  async getNetwork(networkId) {
    const cacheKey = `network:${networkId}`;
    let network = this.get(cacheKey);
    
    if (!network) {
      network = await fetchNetwork(networkId);
      this.set(cacheKey, network);
    }
    
    return network;
  }
}
```

## Pagination Patterns

### Handling Large Result Sets
```javascript
async function getAllAdvertisers(networkId) {
  const allAdvertisers = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const response = await fetch(
      `https://api.broadstreetads.com/v1/advertisers?network_id=${networkId}&page=${page}&limit=100&api_key=${API_KEY}`
    );
    
    const data = await response.json();
    
    if (data.advertisers && data.advertisers.length > 0) {
      allAdvertisers.push(...data.advertisers);
      page++;
      
      // If we got less than the limit, we're done
      hasMore = data.advertisers.length === 100;
    } else {
      hasMore = false;
    }
    
    // Respect rate limits
    await delay(100);
  }
  
  return allAdvertisers;
}
```

## Configuration Management

### Environment-Based Configuration
```javascript
const config = {
  development: {
    baseUrl: 'https://api-dev.broadstreetads.com/v1',
    rateLimit: { requests: 10, window: 60000 },
    timeout: 30000
  },
  staging: {
    baseUrl: 'https://api-staging.broadstreetads.com/v1',
    rateLimit: { requests: 5, window: 30000 },
    timeout: 15000
  },
  production: {
    baseUrl: 'https://api.broadstreetads.com/v1',
    rateLimit: { requests: 2, window: 5000 }, // Reporting limit
    timeout: 10000
  }
};

const environment = process.env.NODE_ENV || 'development';
const apiConfig = config[environment];
```

## Testing Patterns

### Mock API Responses
```javascript
// Mock successful responses for testing
const mockResponses = {
  networks: {
    "networks": [
      {"id": "1", "name": "Test Network", "path": "/networks/1"}
    ]
  },
  advertisers: {
    "advertisers": [
      {"id": "1", "name": "Test Advertiser", "notes": null}
    ]
  }
};

// Test helper
function mockBroadstreetAPI(endpoint) {
  const mockData = mockResponses[endpoint];
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(mockData)
  });
}
```

### Integration Test Pattern
```javascript
describe('Campaign Creation Flow', () => {
  let testNetworkId;
  let testAdvertiserId;
  
  beforeAll(async () => {
    // Setup test data
    const network = await createTestNetwork();
    testNetworkId = network.id;
    
    const advertiser = await createTestAdvertiser(testNetworkId);
    testAdvertiserId = advertiser.id;
  });
  
  afterAll(async () => {
    // Cleanup test data
    await deleteTestAdvertiser(testAdvertiserId);
    await deleteTestNetwork(testNetworkId);
  });
  
  test('should create complete campaign', async () => {
    // Test implementation
  });
});
```

## Monitoring and Observability

### Request Logging Pattern
```javascript
function logApiRequest(method, url, params, response, duration) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    method,
    url,
    params: JSON.stringify(params),
    status: response.status,
    duration: `${duration}ms`,
    success: response.ok
  }));
}

// Usage in API client
const start = Date.now();
const response = await fetch(url, options);
const duration = Date.now() - start;
logApiRequest('GET', url, params, response, duration);
```

### Health Check Pattern
```javascript
async function healthCheck() {
  try {
    const response = await fetch(
      `https://api.broadstreetads.com/v1/networks?api_key=${API_KEY}`,
      { timeout: 5000 }
    );
    
    return {
      status: response.ok ? 'healthy' : 'unhealthy',
      statusCode: response.status,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}
```