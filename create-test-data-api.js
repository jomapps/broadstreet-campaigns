const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3005'; // Next.js dev server port
    const TEST_NETWORK_ID = 9396; // Real network ID from Broadstreet API

async function createTestData() {
  console.log('=== Creating Test Data via API ===\n');

  try {
    // Test data with "Leo Test" prefix
    const testData = {
      advertisers: [
        {
          name: 'Leo Test Advertiser',
          network_id: TEST_NETWORK_ID,
          web_home_url: 'https://leotest.com',
          notes: 'Test advertiser created for sync testing'
        },
        {
          name: 'Leo Test Advertiser 2',
          network_id: TEST_NETWORK_ID,
          web_home_url: 'https://leotest2.com',
          notes: 'Second test advertiser'
        },
        {
          name: 'Leo Test Advertiser 3',
          network_id: TEST_NETWORK_ID,
          web_home_url: 'https://leotest3.com',
          notes: 'Third test advertiser'
        }
      ],
      zones: [
        {
          name: 'Leo Test Zone',
          network_id: TEST_NETWORK_ID,
          alias: 'leo-test-zone',
          self_serve: false
        },
        {
          name: 'Leo Test Zone 2',
          network_id: TEST_NETWORK_ID,
          alias: 'leo-test-zone-2',
          self_serve: true
        },
        {
          name: 'Leo Test Zone 3',
          network_id: TEST_NETWORK_ID,
          alias: 'leo-test-zone-3',
          self_serve: false
        }
      ],
      campaigns: [
        {
          name: 'Leo Test Campaign',
          network_id: TEST_NETWORK_ID,
          start_date: '2024-01-01',
          end_date: '2024-12-31',
          max_impression_count: 10000,
          display_type: 'no_repeat',
          active: true,
          weight: 1,
          archived: false,
          pacing_type: 'asap',
          impression_max_type: 'cap',
          paused: false,
          notes: 'Test campaign created for sync testing'
        },
        {
          name: 'Leo Test Campaign 2',
          network_id: TEST_NETWORK_ID,
          start_date: '2024-01-01',
          end_date: '2024-12-31',
          max_impression_count: 5000,
          display_type: 'allow_repeat_campaign',
          active: true,
          weight: 1.5,
          archived: false,
          pacing_type: 'even',
          impression_max_type: 'goal',
          paused: false,
          notes: 'Second test campaign'
        },
        {
          name: 'Leo Test Campaign 3',
          network_id: TEST_NETWORK_ID,
          start_date: '2024-01-01',
          end_date: '2024-12-31',
          max_impression_count: 7500,
          display_type: 'allow_repeat_advertisement',
          active: true,
          weight: 2,
          archived: false,
          pacing_type: 'asap',
          impression_max_type: 'cap',
          paused: false,
          notes: 'Third test campaign'
        }
      ]
    };

    // Create advertisers
    console.log('Creating test advertisers...');
    for (const advertiserData of testData.advertisers) {
      try {
        const response = await axios.post(`${BASE_URL}/api/create/advertiser`, advertiserData);
        console.log(`✅ Created advertiser: ${advertiserData.name}`);
      } catch (error) {
        console.log(`❌ Failed to create advertiser ${advertiserData.name}:`, error.response?.data?.error || error.message);
      }
    }

    // Create zones
    console.log('\nCreating test zones...');
    for (const zoneData of testData.zones) {
      try {
        const response = await axios.post(`${BASE_URL}/api/create/zone`, zoneData);
        console.log(`✅ Created zone: ${zoneData.name}`);
      } catch (error) {
        console.log(`❌ Failed to create zone ${zoneData.name}:`, error.response?.data?.error || error.message);
      }
    }

    // Create campaigns (these will need advertiser_id to be set properly)
    console.log('\nCreating test campaigns...');
    for (const campaignData of testData.campaigns) {
      try {
        // For now, we'll create campaigns without advertiser_id
        // In a real scenario, you'd need to get the advertiser IDs first
        const response = await axios.post(`${BASE_URL}/api/create/campaign`, campaignData);
        console.log(`✅ Created campaign: ${campaignData.name}`);
      } catch (error) {
        console.log(`❌ Failed to create campaign ${campaignData.name}:`, error.response?.data?.error || error.message);
      }
    }

    console.log('\n=== Test Data Creation Complete ===');
    console.log('Created test entities with "Leo Test" prefix');
    console.log('Ready for sync testing!');

  } catch (error) {
    console.error('Error creating test data:', error.message);
    console.log('\nMake sure the Next.js development server is running on port 3005');
    console.log('Run: npm run dev');
  }
}

// Run the script
createTestData();
