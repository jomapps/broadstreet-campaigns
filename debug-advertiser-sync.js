const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.BROADSTREET_API_BASE_URL || 'https://api.broadstreetads.com/api/1';
const API_TOKEN = process.env.BROADSTREET_API_TOKEN || '';
const LOCAL_API_BASE = 'http://localhost:3005/api';

async function debugAdvertiserSync() {
  console.log('🔍 Debugging Advertiser Sync Issue - Missing ID 217326');
  console.log('='.repeat(60));

  try {
    // Step 1: Check what networks we have locally via API
    console.log('\n1. Checking local networks via API...');
    try {
      const networksResponse = await axios.get(`${LOCAL_API_BASE}/networks`);
      const networks = networksResponse.data.networks || [];
      console.log(`Found ${networks.length} networks locally:`);
      networks.forEach(n => {
        console.log(`  - Network ${n.broadstreet_id}: ${n.name}`);
      });

      // Step 2: For each network, check what advertisers we have locally vs API
      for (const network of networks) {
        console.log(`\n2. Checking advertisers for network ${network.broadstreet_id} (${network.name})...`);

        // Check local advertisers via API
        try {
          const localAdvertisersResponse = await axios.get(`${LOCAL_API_BASE}/advertisers?network_id=${network.broadstreet_id}`);
          const localAdvertisers = localAdvertisersResponse.data.advertisers || [];
          console.log(`  Local advertisers: ${localAdvertisers.length}`);

          // Check if 217326 is in local advertisers
          const target217326 = localAdvertisers.find(a => a.broadstreet_id === 217326);
          if (target217326) {
            console.log(`  ✅ Found advertiser 217326 locally: ${target217326.name}`);
          } else {
            console.log(`  ❌ Advertiser 217326 NOT found locally`);
          }
        } catch (localError) {
          console.log(`  ❌ Error fetching local advertisers: ${localError.message}`);
        }

        // Check API advertisers directly
        try {
          console.log(`  Fetching advertisers from Broadstreet API for network ${network.broadstreet_id}...`);
          const apiUrl = `${API_BASE_URL}/advertisers?network_id=${network.broadstreet_id}&access_token=${API_TOKEN}`;
          console.log(`  API URL: ${apiUrl.replace(API_TOKEN, 'HIDDEN_TOKEN')}`);
          console.log(`  API_BASE_URL: ${API_BASE_URL}`);
          console.log(`  API_TOKEN length: ${API_TOKEN.length}`);

          const response = await axios.get(apiUrl);
          const apiAdvertisers = response.data.advertisers || [];
          console.log(`  API advertisers: ${apiAdvertisers.length}`);

          // Check if 217326 is in API response
          const apiTarget217326 = apiAdvertisers.find(a => a.id === 217326 || a.broadstreet_id === 217326);
          if (apiTarget217326) {
            console.log(`  ✅ Found advertiser 217326 in API: ${apiTarget217326.name}`);
            console.log(`  API advertiser data:`, JSON.stringify(apiTarget217326, null, 2));
          } else {
            console.log(`  ❌ Advertiser 217326 NOT found in API response`);
          }

          // Show first few advertisers from API for comparison
          console.log(`  First 3 API advertisers:`);
          apiAdvertisers.slice(0, 3).forEach(a => {
            console.log(`    - ID ${a.id}: ${a.name}`);
          });

          // Check if there are any advertisers with ID close to 217326
          const closeIds = apiAdvertisers.filter(a =>
            Math.abs(a.id - 217326) < 100
          ).sort((a, b) => a.id - b.id);

          if (closeIds.length > 0) {
            console.log(`  Advertisers with IDs close to 217326:`);
            closeIds.forEach(a => {
              console.log(`    - ID ${a.id}: ${a.name}`);
            });
          }

        } catch (apiError) {
          console.log(`  ❌ API Error for network ${network.broadstreet_id}:`, apiError.message);
          if (apiError.response) {
            console.log(`  Status: ${apiError.response.status}`);
            console.log(`  Response: ${JSON.stringify(apiError.response.data, null, 2)}`);
          }
        }
      }
    } catch (networkError) {
      console.log(`❌ Error fetching networks: ${networkError.message}`);
    }

    // Step 3: Check campaigns that might reference advertiser 217326
    console.log('\n3. Checking campaigns for advertiser 217326...');
    try {
      const campaignsResponse = await axios.get(`${LOCAL_API_BASE}/campaigns`);
      const campaigns = campaignsResponse.data.campaigns || [];
      const campaigns217326 = campaigns.filter(c => c.advertiser_id === 217326);
      console.log(`  Campaigns referencing advertiser 217326: ${campaigns217326.length}`);

      if (campaigns217326.length > 0) {
        campaigns217326.forEach(c => {
          console.log(`    - Campaign: ${c.name} (ID: ${c.broadstreet_id})`);
        });
      }
    } catch (campaignError) {
      console.log(`  ❌ Error fetching campaigns: ${campaignError.message}`);
    }

  } catch (error) {
    console.error('Error during debugging:', error);
  }
}

// Run the debug script
debugAdvertiserSync().catch(console.error);
