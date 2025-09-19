require('dotenv').config({ path: '.env.local' });

// Import the fetchCampaigns function
const { fetchCampaigns } = require('./src/lib/server/data-fetchers');

async function testFetchCampaigns() {
  try {
    console.log('🧪 Testing fetchCampaigns function...');
    
    // Test 1: Fetch all campaigns (no filters)
    console.log('\n=== Test 1: All campaigns ===');
    const allCampaigns = await fetchCampaigns(null, {});
    console.log(`Total campaigns: ${allCampaigns.length}`);
    
    // Show first few campaigns
    allCampaigns.slice(0, 5).forEach((c, idx) => {
      console.log(`${idx + 1}. ${c.name}`);
      console.log(`   Network ID: ${c.network_id}`);
      console.log(`   Advertiser ID: ${c.advertiser_id}`);
      console.log(`   Broadstreet ID: ${c.broadstreet_id || 'undefined'}`);
      console.log(`   Source: ${c.source || 'unknown'}`);
      console.log('');
    });
    
    // Test 2: Fetch campaigns for advertiser 214951 (UNBOUND MEDIA)
    console.log('\n=== Test 2: Campaigns for advertiser 214951 ===');
    const unboundCampaigns = await fetchCampaigns(214951, {});
    console.log(`UNBOUND MEDIA campaigns: ${unboundCampaigns.length}`);
    
    unboundCampaigns.forEach((c, idx) => {
      console.log(`${idx + 1}. ${c.name}`);
      console.log(`   Network ID: ${c.network_id}`);
      console.log(`   Advertiser ID: ${c.advertiser_id}`);
      console.log(`   Broadstreet ID: ${c.broadstreet_id || 'undefined'}`);
      console.log(`   Source: ${c.source || 'unknown'}`);
      console.log(`   Synced: ${c.synced_with_api}`);
      console.log('');
    });
    
    // Test 3: Fetch campaigns with network filter
    console.log('\n=== Test 3: Campaigns with network 9396 ===');
    const networkCampaigns = await fetchCampaigns(null, { networkId: 9396 });
    console.log(`Network 9396 campaigns: ${networkCampaigns.length}`);
    
    // Show local campaigns specifically
    const localCampaigns = networkCampaigns.filter(c => c.source === 'local');
    console.log(`Local campaigns in network 9396: ${localCampaigns.length}`);
    
    localCampaigns.forEach((c, idx) => {
      console.log(`${idx + 1}. ${c.name}`);
      console.log(`   Network ID: ${c.network_id}`);
      console.log(`   Advertiser ID: ${c.advertiser_id}`);
      console.log(`   Source: ${c.source}`);
      console.log(`   Synced: ${c.synced_with_api}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error testing fetchCampaigns:', error);
  }
}

testFetchCampaigns();
