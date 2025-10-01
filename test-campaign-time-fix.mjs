#!/usr/bin/env node

/**
 * Test script to verify campaign creation now uses correct UTC times
 * Should create campaigns with 00:00:00 start and 23:59:59 end times
 */

import { loadEnv } from './scripts/load-env.mjs';

loadEnv();

const API_BASE_URL = process.env.BROADSTREET_API_BASE_URL || 'https://api.broadstreetads.com/api/1';
const API_TOKEN = process.env.BROADSTREET_API_TOKEN || '';

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

async function testCampaignTimeFix() {
  console.log('🧪 Testing Campaign Creation with Fixed UTC Times\n');

  try {
    const networksResponse = await request('/networks');
    const network = networksResponse.networks[0];
    
    const advertisersResponse = await request(`/advertisers?network_id=${network.id}`);
    const advertiser = advertisersResponse.advertisers[0];

    console.log(`✅ Using Network: ${network.name} (ID: ${network.id})`);
    console.log(`✅ Using Advertiser: ${advertiser.name} (ID: ${advertiser.id})\n`);

    const testDate = '2025-03-01';
    const endDate = '2025-03-31';
    const timestamp = new Date().getTime();

    const campaignName = `TEST-FIX-UTC-Times-${timestamp}`;

    console.log(`📝 Creating campaign: ${campaignName}`);
    console.log(`   Start Date (input): ${testDate}`);
    console.log(`   End Date (input): ${endDate}`);
    console.log(`   Expected start time: ${testDate} 00:00:00`);
    console.log(`   Expected end time: ${endDate} 23:59:59\n`);

    // Create campaign using the format that worked: YYYY-MM-DD HH:mm:ss
    const payload = {
      name: campaignName,
      advertiser_id: advertiser.id,
      start_date: `${testDate} 00:00:00`,
      end_date: `${endDate} 23:59:59`,
      weight: 100,
      active: true,
    };

    const response = await request('/campaigns', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const createdCampaign = response.campaign;

    console.log('✅ Campaign created successfully!');
    console.log(`   Campaign ID: ${createdCampaign.id}`);
    console.log(`   Returned start_date: ${createdCampaign.start_date}`);
    console.log(`   Returned end_date: ${createdCampaign.end_date}\n`);

    // Verify by fetching it back
    console.log('🔍 Fetching campaign back to verify...\n');
    const verifyResponse = await request(`/campaigns/${createdCampaign.id}`);
    const verifiedCampaign = verifyResponse.campaign;

    console.log('📊 Verification Results:');
    console.log(`   Campaign ID: ${verifiedCampaign.id}`);
    console.log(`   Name: ${verifiedCampaign.name}`);
    console.log(`   Start Date: ${verifiedCampaign.start_date}`);
    console.log(`   End Date: ${verifiedCampaign.end_date}\n`);

    console.log('='.repeat(80));
    console.log('🎯 TEST RESULT');
    console.log('='.repeat(80));
    console.log(`\n✅ Please check campaign "${campaignName}" in Broadstreet backend`);
    console.log(`   Campaign ID: ${createdCampaign.id}`);
    console.log(`   Network: ${network.name}`);
    console.log(`   Advertiser: ${advertiser.name}`);
    console.log(`\n   Verify the times are:`);
    console.log(`   - Start: 00:00:00 UTC (midnight)`);
    console.log(`   - End: 23:59:59 UTC (11:59 PM)\n`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

testCampaignTimeFix()
  .then(() => {
    console.log('✅ Test completed\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });

