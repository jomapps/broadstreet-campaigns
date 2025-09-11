const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3005'; // Next.js dev server port
const TEST_NETWORK_ID = 9396; // Real network ID from Broadstreet API

async function testSyncAPI() {
  console.log('=== Testing Sync API Endpoints ===\n');

  try {
    // Test 1: Dry Run
    console.log('1. Testing Dry Run...');
    try {
      const dryRunResponse = await axios.get(`${BASE_URL}/api/sync/local-all?networkId=${TEST_NETWORK_ID}`);
      console.log('✅ Dry Run Response:');
      console.log('- Valid:', dryRunResponse.data.dryRun?.valid);
      console.log('- Warnings:', dryRunResponse.data.dryRun?.warnings?.length || 0);
      console.log('- Errors:', dryRunResponse.data.dryRun?.errors?.length || 0);
      if (dryRunResponse.data.dryRun?.errors?.length > 0) {
        console.log('Errors:', dryRunResponse.data.dryRun.errors);
      }
    } catch (error) {
      console.log('❌ Dry Run Failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    // Test 2: Sync Advertisers
    console.log('2. Testing Advertiser Sync...');
    try {
      const advertiserResponse = await axios.post(`${BASE_URL}/api/sync/advertisers`, {
        networkId: TEST_NETWORK_ID
      });
      console.log('✅ Advertiser Sync Response:');
      console.log('- Success:', advertiserResponse.data.success);
      console.log('- Total:', advertiserResponse.data.summary?.total || 0);
      console.log('- Successful:', advertiserResponse.data.summary?.successful || 0);
      console.log('- Failed:', advertiserResponse.data.summary?.failed || 0);
      
      if (advertiserResponse.data.results) {
        advertiserResponse.data.results.forEach((result, index) => {
          console.log(`  ${index + 1}. ${result.localEntity?.name}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
          if (!result.success) {
            console.log(`     Error: ${result.error}`);
            console.log(`     Code: ${result.code}`);
          } else {
            console.log(`     Broadstreet ID: ${result.entity?.id}`);
          }
        });
      }
    } catch (error) {
      console.log('❌ Advertiser Sync Failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    // Test 3: Sync Zones
    console.log('3. Testing Zone Sync...');
    try {
      const zoneResponse = await axios.post(`${BASE_URL}/api/sync/zones`, {
        networkId: TEST_NETWORK_ID
      });
      console.log('✅ Zone Sync Response:');
      console.log('- Success:', zoneResponse.data.success);
      console.log('- Total:', zoneResponse.data.summary?.total || 0);
      console.log('- Successful:', zoneResponse.data.summary?.successful || 0);
      console.log('- Failed:', zoneResponse.data.summary?.failed || 0);
      
      if (zoneResponse.data.results) {
        zoneResponse.data.results.forEach((result, index) => {
          console.log(`  ${index + 1}. ${result.localEntity?.name}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
          if (!result.success) {
            console.log(`     Error: ${result.error}`);
            console.log(`     Code: ${result.code}`);
          } else {
            console.log(`     Broadstreet ID: ${result.entity?.id}`);
          }
        });
      }
    } catch (error) {
      console.log('❌ Zone Sync Failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    // Test 4: Sync Campaigns
    console.log('4. Testing Campaign Sync...');
    try {
      const campaignResponse = await axios.post(`${BASE_URL}/api/sync/campaigns`, {
        networkId: TEST_NETWORK_ID
      });
      console.log('✅ Campaign Sync Response:');
      console.log('- Success:', campaignResponse.data.success);
      console.log('- Total:', campaignResponse.data.summary?.total || 0);
      console.log('- Successful:', campaignResponse.data.summary?.successful || 0);
      console.log('- Failed:', campaignResponse.data.summary?.failed || 0);
      
      if (campaignResponse.data.results) {
        campaignResponse.data.results.forEach((result, index) => {
          console.log(`  ${index + 1}. ${result.localEntity?.name}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
          if (!result.success) {
            console.log(`     Error: ${result.error}`);
            console.log(`     Code: ${result.code}`);
          } else {
            console.log(`     Broadstreet ID: ${result.entity?.id}`);
          }
        });
      }
    } catch (error) {
      console.log('❌ Campaign Sync Failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    // Test 5: Create Placements
    console.log('5. Testing Placement Creation...');
    try {
      const placementResponse = await axios.post(`${BASE_URL}/api/sync/placements`, {
        networkId: TEST_NETWORK_ID
      });
      console.log('✅ Placement Creation Response:');
      console.log('- Success:', placementResponse.data.success);
      console.log('- Total:', placementResponse.data.summary?.total || 0);
      console.log('- Successful:', placementResponse.data.summary?.successful || 0);
      console.log('- Failed:', placementResponse.data.summary?.failed || 0);
      
      if (placementResponse.data.results) {
        placementResponse.data.results.forEach((result, index) => {
          console.log(`  ${index + 1}. Placement: ${result.success ? 'SUCCESS' : 'FAILED'}`);
          if (!result.success) {
            console.log(`     Error: ${result.error}`);
            console.log(`     Code: ${result.code}`);
          }
        });
      }
    } catch (error) {
      console.log('❌ Placement Creation Failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    // Test 6: Full Sync
    console.log('6. Testing Full Sync...');
    try {
      const fullSyncResponse = await axios.post(`${BASE_URL}/api/sync/local-all`, {
        networkId: TEST_NETWORK_ID
      });
      console.log('✅ Full Sync Response:');
      console.log('- Success:', fullSyncResponse.data.success);
      if (fullSyncResponse.data.report) {
        console.log('- Total Entities:', fullSyncResponse.data.report.totalEntities);
        console.log('- Successful Syncs:', fullSyncResponse.data.report.successfulSyncs);
        console.log('- Failed Syncs:', fullSyncResponse.data.report.failedSyncs);
        console.log('- Duration:', fullSyncResponse.data.report.duration, 'ms');
      }
    } catch (error) {
      console.log('❌ Full Sync Failed:', error.response?.data?.error || error.message);
    }

  } catch (error) {
    console.error('Test setup error:', error.message);
    console.log('\nMake sure the Next.js development server is running on port 3005');
    console.log('Run: npm run dev');
  }
}

// Run the tests
testSyncAPI();
