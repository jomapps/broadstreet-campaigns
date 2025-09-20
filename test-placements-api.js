const axios = require('axios');

async function testPlacementsAPI() {
  try {
    console.log('Testing placements API...');
    
    // Test with the same parameters the UI is using
    const params = new URLSearchParams({
      network_id: '9396',
      advertiser_id: '217326', 
      campaign_id: '846562'
    });
    
    const url = `http://localhost:3005/api/placements?${params.toString()}`;
    console.log('Request URL:', url);
    
    const response = await axios.get(url);
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.placements) {
      console.log(`\nFound ${response.data.placements.length} placements`);
      
      // Show first few placements
      response.data.placements.slice(0, 5).forEach((placement, index) => {
        console.log(`${index + 1}. Ad: ${placement.advertisement_id}, Zone: ${placement.zone_id || placement.zone_mongo_id}, Campaign: ${placement.campaign_id || placement.campaign_mongo_id}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testPlacementsAPI();
