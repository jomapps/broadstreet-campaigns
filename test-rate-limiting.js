const axios = require('axios');

const LOCAL_API_BASE = 'http://localhost:3005/api';

async function testRateLimiting() {
  console.log('🔍 Testing Rate Limiting - 1 request every 5 seconds');
  console.log('='.repeat(60));

  try {
    // Test 1: Check networks (should be fast)
    console.log('\n1. Testing networks endpoint (no rate limiting)...');
    const start1 = Date.now();
    const networksResponse = await axios.get(`${LOCAL_API_BASE}/networks`);
    const end1 = Date.now();
    console.log(`✅ Networks fetched in ${end1 - start1}ms`);
    console.log(`Found ${networksResponse.data.networks?.length || 0} networks`);

    if (networksResponse.data.networks && networksResponse.data.networks.length > 0) {
      const networkId = networksResponse.data.networks[0].broadstreet_id;
      console.log(`Using network ${networkId} for rate limiting test`);

      // Test 2: Sync network data (should be rate limited)
      console.log('\n2. Testing network sync with rate limiting...');
      console.log('This should take at least 15-20 seconds due to rate limiting (1 request every 5s)');
      
      const start2 = Date.now();
      
      try {
        const syncResponse = await axios.post(`${LOCAL_API_BASE}/sync/network`, {
          networkId: networkId
        }, {
          timeout: 120000 // 2 minute timeout
        });
        
        const end2 = Date.now();
        const duration = Math.round((end2 - start2) / 1000);
        
        console.log(`✅ Network sync completed in ${duration} seconds`);
        console.log(`Success: ${syncResponse.data.success}`);
        
        if (syncResponse.data.counts) {
          console.log('Sync counts:', syncResponse.data.counts);
        }
        
        // Verify rate limiting worked (should take at least 15 seconds for multiple API calls)
        if (duration >= 15) {
          console.log('✅ Rate limiting appears to be working (took >= 15 seconds)');
        } else {
          console.log('⚠️  Rate limiting might not be working (completed too quickly)');
        }
        
      } catch (syncError) {
        console.log(`❌ Network sync failed: ${syncError.message}`);
        if (syncError.response) {
          console.log(`Status: ${syncError.response.status}`);
          console.log(`Response: ${JSON.stringify(syncError.response.data, null, 2)}`);
        }
      }
    }

  } catch (error) {
    console.error('Error during rate limiting test:', error.message);
  }
}

// Run the test
testRateLimiting().catch(console.error);
