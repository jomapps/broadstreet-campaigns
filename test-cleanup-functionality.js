#!/usr/bin/env node

/**
 * Test script to verify the new cleanup functionality in dashboard sync
 * This script tests that both Broadstreet and local-only collections are deleted before fresh sync
 */

const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function testCleanupFunctionality() {
  console.log('🧪 Testing Dashboard Sync Cleanup Functionality');
  console.log('================================================');
  console.log('');

  try {
    // Step 1: Get initial counts
    console.log('1. Getting initial collection counts...');
    const initialResponse = await axios.post(`${BASE_URL}/api/sync/all`);
    const initialResults = initialResponse.data.results;
    
    console.log('Initial counts:');
    console.log('- Cleanup:', initialResults.cleanup?.count || 'N/A');
    console.log('- Networks:', initialResults.networks?.count || 0);
    console.log('- Advertisers:', initialResults.advertisers?.count || 0);
    console.log('- Zones:', initialResults.zones?.count || 0);
    console.log('- Campaigns:', initialResults.campaigns?.count || 0);
    console.log('- Advertisements:', initialResults.advertisements?.count || 0);
    console.log('- Placements:', initialResults.placements?.count || 0);
    console.log('');

    // Step 2: Run sync again to test cleanup
    console.log('2. Running second sync to test cleanup...');
    const secondResponse = await axios.post(`${BASE_URL}/api/sync/all`);
    const secondResults = secondResponse.data.results;
    
    console.log('Second sync results:');
    console.log('- Cleanup successful:', secondResults.cleanup?.success || false);
    console.log('- Items deleted in cleanup:', secondResults.cleanup?.count || 0);
    console.log('- Networks synced:', secondResults.networks?.count || 0);
    console.log('- Advertisers synced:', secondResults.advertisers?.count || 0);
    console.log('- Zones synced:', secondResults.zones?.count || 0);
    console.log('- Campaigns synced:', secondResults.campaigns?.count || 0);
    console.log('- Advertisements synced:', secondResults.advertisements?.count || 0);
    console.log('- Placements synced:', secondResults.placements?.count || 0);
    console.log('');

    // Step 3: Verify cleanup worked
    if (secondResults.cleanup?.success) {
      console.log('✅ Cleanup functionality is working!');
      console.log(`   - Deleted ${secondResults.cleanup.count} items (Broadstreet + local-only) before fresh sync`);
    } else {
      console.log('❌ Cleanup functionality failed');
      if (secondResults.cleanup?.error) {
        console.log('   Error:', secondResults.cleanup.error);
      }
    }

    // Step 4: Verify all sync operations succeeded
    const allSuccessful = Object.entries(secondResults).every(([key, result]) => {
      return result.success === true;
    });

    if (allSuccessful) {
      console.log('✅ All sync operations completed successfully');
    } else {
      console.log('❌ Some sync operations failed');
      Object.entries(secondResults).forEach(([key, result]) => {
        if (!result.success) {
          console.log(`   - ${key}: ${result.error || 'Unknown error'}`);
        }
      });
    }

    console.log('');
    console.log('🎉 Test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.error || error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
testCleanupFunctionality();
