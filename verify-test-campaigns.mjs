#!/usr/bin/env node

/**
 * Verify if the test campaigns actually exist in Broadstreet
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

async function verifyCampaigns() {
  console.log('🔍 Verifying Test Campaigns...\n');

  const campaignIds = [852537, 852538, 852539, 852540];
  const advertiserId = 198674;

  try {
    // First, try to get each campaign by ID
    console.log('Method 1: Fetching campaigns by individual ID\n');
    
    for (const campaignId of campaignIds) {
      try {
        const response = await request(`/campaigns/${campaignId}`);
        const campaign = response.campaign;
        
        console.log(`✅ Campaign ${campaignId} exists!`);
        console.log(`   Name: ${campaign.name}`);
        console.log(`   Start Date: ${campaign.start_date}`);
        console.log(`   End Date: ${campaign.end_date}`);
        console.log(`   Active: ${campaign.active}`);
        console.log(`   Advertiser ID: ${campaign.advertiser_id}\n`);
      } catch (error) {
        console.log(`❌ Campaign ${campaignId} NOT FOUND`);
        console.log(`   Error: ${error.message}\n`);
      }
    }

    // Second, get all campaigns for the advertiser and search for our test campaigns
    console.log('\n' + '='.repeat(80));
    console.log('Method 2: Listing all campaigns for advertiser 198674\n');
    
    const response = await request(`/campaigns?advertiser_id=${advertiserId}`);
    const campaigns = response.campaigns;
    
    console.log(`Found ${campaigns.length} total campaigns for this advertiser\n`);
    
    const testCampaigns = campaigns.filter(c => c.name.includes('TEST-UTC'));
    
    if (testCampaigns.length > 0) {
      console.log(`✅ Found ${testCampaigns.length} TEST-UTC campaigns:\n`);
      testCampaigns.forEach(campaign => {
        console.log(`   Campaign ID: ${campaign.id}`);
        console.log(`   Name: ${campaign.name}`);
        console.log(`   Start: ${campaign.start_date}`);
        console.log(`   End: ${campaign.end_date}`);
        console.log(`   Active: ${campaign.active}\n`);
      });
    } else {
      console.log('❌ No TEST-UTC campaigns found in the advertiser\'s campaign list\n');
      console.log('First 5 campaigns in the list:');
      campaigns.slice(0, 5).forEach(c => {
        console.log(`   - ${c.name} (ID: ${c.id})`);
      });
    }

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    throw error;
  }
}

verifyCampaigns()
  .then(() => {
    console.log('\n✅ Verification complete\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  });

