const broadstreetAPI = require('./src/lib/broadstreet-api').default;

async function testAPI() {
  try {
    console.log('Testing Broadstreet API...');
    console.log('API Base URL:', process.env.BROADSTREET_API_BASE_URL || 'https://api.broadstreetads.com/api/1');
    console.log('API Token exists:', !!process.env.BROADSTREET_API_TOKEN);
    console.log('API Token length:', process.env.BROADSTREET_API_TOKEN ? process.env.BROADSTREET_API_TOKEN.length : 0);
    
    // Test a simple GET request first
    console.log('\nTesting GET request...');
    const networks = await broadstreetAPI.getNetworks();
    console.log('Networks fetched successfully:', networks.length, 'networks');
    
    // Test campaign creation with minimal data
    console.log('\nTesting campaign creation...');
    const campaignData = {
      name: 'Test Campaign API',
      advertiser_id: 216500, // Use the advertiser ID from our local campaign
      start_date: '2025-09-11',
      weight: 1
    };
    
    console.log('Campaign data:', campaignData);
    const campaign = await broadstreetAPI.createCampaign(campaignData);
    console.log('Campaign created successfully:', campaign);
    
  } catch (error) {
    console.error('API Test Error:', error.message);
    console.error('Full error:', error);
  }
}

testAPI();
