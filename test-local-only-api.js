const axios = require('axios');

async function testLocalOnlyAPI() {
  try {
    console.log('🧪 Testing Local-Only API Endpoint');
    console.log('');
    
    // Test the API endpoint that the local-only page uses
    const response = await axios.get('http://localhost:3005/api/local-entities');
    
    console.log('✅ API Response Status:', response.status);
    console.log('📊 Response Data:');
    
    const data = response.data;
    
    console.log(`  Zones: ${data.zones?.length || 0}`);
    console.log(`  Advertisers: ${data.advertisers?.length || 0}`);
    console.log(`  Campaigns: ${data.campaigns?.length || 0}`);
    console.log(`  Networks: ${data.networks?.length || 0}`);
    console.log(`  Advertisements: ${data.advertisements?.length || 0}`);
    
    // Show sample data if available
    if (data.campaigns && data.campaigns.length > 0) {
      console.log('\n📋 Sample Campaign:');
      const campaign = data.campaigns[0];
      console.log(`  Name: ${campaign.name}`);
      console.log(`  ID: ${campaign.mongo_id || campaign._id}`);
      console.log(`  Network ID: ${campaign.network_id}`);
      console.log(`  Synced: ${campaign.synced_with_api}`);
      console.log(`  Created Locally: ${campaign.created_locally}`);
      if (campaign.placements) {
        console.log(`  Embedded Placements: ${campaign.placements.length}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
  }
}

async function testLocalOnlyPage() {
  try {
    console.log('\n🌐 Testing Local-Only Page');
    console.log('');
    
    // Test the actual page
    const response = await axios.get('http://localhost:3005/local-only');
    
    console.log('✅ Page Response Status:', response.status);
    console.log('📄 Page loaded successfully');
    
    // Check if it contains error messages
    if (response.data.includes('Error loading local entities')) {
      console.log('❌ Page contains error message');
    } else {
      console.log('✅ Page loaded without error messages');
    }
    
  } catch (error) {
    console.error('❌ Error testing page:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
    }
  }
}

async function main() {
  await testLocalOnlyAPI();
  await testLocalOnlyPage();
}

main();
