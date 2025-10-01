#!/usr/bin/env node

/**
 * Test script to create campaigns with explicit UTC times
 * Tests different date/time formats to see how Broadstreet API handles them
 */

import { loadEnv } from './scripts/load-env.mjs';

loadEnv();

const API_BASE_URL = process.env.BROADSTREET_API_BASE_URL || 'https://api.broadstreetads.com/api/1';
const API_TOKEN = process.env.BROADSTREET_API_TOKEN || '';

if (!API_TOKEN) {
  console.error('❌ BROADSTREET_API_TOKEN is not set in environment variables');
  process.exit(1);
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}access_token=${API_TOKEN}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const responseText = await response.text();
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}\n${responseText}`);
  }

  return responseText ? JSON.parse(responseText) : undefined;
}

async function testCampaignCreationWithUTCTimes() {
  console.log('🧪 Testing Campaign Creation with UTC Times\n');

  try {
    // First, get networks to find a network ID
    const networksResponse = await request('/networks');
    const network = networksResponse.networks[0];
    
    if (!network) {
      console.error('❌ No networks found');
      return;
    }

    console.log(`✅ Using Network: ${network.name} (ID: ${network.id})\n`);

    // Get advertisers for this network
    const advertisersResponse = await request(`/advertisers?network_id=${network.id}`);
    const advertiser = advertisersResponse.advertisers[0];

    if (!advertiser) {
      console.error('❌ No advertisers found');
      return;
    }

    console.log(`✅ Using Advertiser: ${advertiser.name} (ID: ${advertiser.id})\n`);

    // Test date: January 15, 2025
    const testDate = '2025-01-15';
    const endDate = '2025-02-15';
    
    const timestamp = new Date().getTime();

    // Test different time formats
    const testCampaigns = [
      {
        name: `TEST-UTC-1-DateOnly-${timestamp}`,
        description: 'Date only format: YYYY-MM-DD',
        start_date: testDate,
        end_date: endDate,
      },
      {
        name: `TEST-UTC-2-WithTime-00:00-${timestamp}`,
        description: 'With 00:00:00 UTC time',
        start_date: `${testDate} 00:00:00`,
        end_date: `${endDate} 23:59:59`,
      },
      {
        name: `TEST-UTC-3-ISO8601-${timestamp}`,
        description: 'ISO 8601 format with UTC',
        start_date: `${testDate}T00:00:00Z`,
        end_date: `${endDate}T23:59:59Z`,
      },
      {
        name: `TEST-UTC-4-ISO8601-Explicit-${timestamp}`,
        description: 'ISO 8601 with +00:00 timezone',
        start_date: `${testDate}T00:00:00+00:00`,
        end_date: `${endDate}T23:59:59+00:00`,
      },
    ];

    const results = [];

    for (const testCampaign of testCampaigns) {
      try {
        console.log(`\n📝 Creating: ${testCampaign.name}`);
        console.log(`   Format: ${testCampaign.description}`);
        console.log(`   Start: ${testCampaign.start_date}`);
        console.log(`   End: ${testCampaign.end_date}`);

        const payload = {
          name: testCampaign.name,
          advertiser_id: advertiser.id,
          start_date: testCampaign.start_date,
          end_date: testCampaign.end_date,
          weight: 100,
          active: true,
        };

        const response = await request('/campaigns', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        const createdCampaign = response.campaign;
        
        console.log(`   ✅ Created successfully!`);
        console.log(`   Campaign ID: ${createdCampaign.id}`);
        console.log(`   Returned start_date: ${createdCampaign.start_date}`);
        console.log(`   Returned end_date: ${createdCampaign.end_date}`);

        results.push({
          name: testCampaign.name,
          sent_start: testCampaign.start_date,
          sent_end: testCampaign.end_date,
          received_start: createdCampaign.start_date,
          received_end: createdCampaign.end_date,
          campaign_id: createdCampaign.id,
          success: true,
        });

      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
        results.push({
          name: testCampaign.name,
          sent_start: testCampaign.start_date,
          sent_end: testCampaign.end_date,
          error: error.message,
          success: false,
        });
      }
    }

    // Summary
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(80));
    
    console.log('\nPlease check these campaigns in the Broadstreet backend:\n');
    
    results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.name}`);
      if (result.success) {
        console.log(`   ✅ Created (ID: ${result.campaign_id})`);
        console.log(`   Sent Start:     ${result.sent_start}`);
        console.log(`   Received Start: ${result.received_start}`);
        console.log(`   Sent End:       ${result.sent_end}`);
        console.log(`   Received End:   ${result.received_end}`);
      } else {
        console.log(`   ❌ Failed: ${result.error}`);
      }
    });

    console.log('\n' + '='.repeat(80));
    console.log('🔍 ACTION REQUIRED:');
    console.log('='.repeat(80));
    console.log('\nPlease check the Broadstreet backend and verify:');
    console.log('1. What time values are stored for each campaign');
    console.log('2. Which format (if any) resulted in 00:00 UTC start and 23:59 UTC end times');
    console.log('3. Whether timezone conversion occurred\n');
    console.log(`Network: ${network.name}`);
    console.log(`Advertiser: ${advertiser.name}`);
    console.log(`Test Date: ${testDate} (January 15, 2025)`);
    console.log(`End Date: ${endDate} (February 15, 2025)\n`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run the test
testCampaignCreationWithUTCTimes()
  .then(() => {
    console.log('✅ Test completed\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });

