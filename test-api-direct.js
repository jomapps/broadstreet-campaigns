const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local file manually
function loadEnvLocal() {
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');

    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          process.env[key.trim()] = value;
        }
      }
    });
  }
}

// Load environment variables
loadEnvLocal();

// Use environment variables
const API_BASE_URL = process.env.BROADSTREET_API_BASE_URL || 'https://api.broadstreetads.com/api/1';
const API_TOKEN = process.env.BROADSTREET_API_TOKEN;

// Validate required environment variables
if (!API_TOKEN) {
  console.error('❌ Error: BROADSTREET_API_TOKEN environment variable is required');
  console.error('Please ensure BROADSTREET_API_TOKEN is set in .env.local file');
  process.exit(1);
}

async function testAPIDirectly() {
  console.log('🔍 Testing Broadstreet API directly');
  console.log('='.repeat(50));
  console.log(`API_BASE_URL: ${API_BASE_URL}`);
  console.log(`API_TOKEN length: ${API_TOKEN.length}`);
  console.log(`API_TOKEN first 10 chars: ${API_TOKEN.substring(0, 10)}...`);
  console.log('');

  // Test 1: Get networks
  console.log('1. Testing /networks endpoint...');
  try {
    const url = `${API_BASE_URL}/networks?access_token=${API_TOKEN}`;
    console.log(`URL: ${url.replace(API_TOKEN, 'HIDDEN_TOKEN')}`);
    
    const response = await axios.get(url);
    console.log(`✅ Networks API success: ${response.status}`);
    console.log(`Networks found: ${response.data.networks?.length || 0}`);
    
    if (response.data.networks && response.data.networks.length > 0) {
      console.log('First network:', JSON.stringify(response.data.networks[0], null, 2));
    }
  } catch (error) {
    console.log(`❌ Networks API failed: ${error.message}`);
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }

  console.log('');

  // Test 2: Get advertisers for network 9396
  console.log('2. Testing /advertisers endpoint for network 9396...');
  try {
    const url = `${API_BASE_URL}/advertisers?network_id=9396&access_token=${API_TOKEN}`;
    console.log(`URL: ${url.replace(API_TOKEN, 'HIDDEN_TOKEN')}`);
    
    const response = await axios.get(url);
    console.log(`✅ Advertisers API success: ${response.status}`);
    console.log(`Advertisers found: ${response.data.advertisers?.length || 0}`);
    
    if (response.data.advertisers) {
      // Look for advertiser 217326
      const target = response.data.advertisers.find(a => a.id === 217326);
      if (target) {
        console.log(`✅ Found advertiser 217326: ${target.name}`);
      } else {
        console.log(`❌ Advertiser 217326 not found in API response`);
        console.log('First 3 advertisers:');
        response.data.advertisers.slice(0, 3).forEach(a => {
          console.log(`  - ID ${a.id}: ${a.name}`);
        });
      }
    }
  } catch (error) {
    console.log(`❌ Advertisers API failed: ${error.message}`);
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }

  console.log('');

  // Test 3: Test the exact same method as broadstreet-api.ts
  console.log('3. Testing using the same method as broadstreet-api.ts...');
  try {
    const endpoint = '/advertisers?network_id=9396';
    const url = `${API_BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}access_token=${API_TOKEN}`;
    console.log(`URL: ${url.replace(API_TOKEN, 'HIDDEN_TOKEN')}`);
    
    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`✅ Broadstreet-api.ts method success: ${response.status}`);
    console.log(`Advertisers found: ${response.data.advertisers?.length || 0}`);
    
    if (response.data.advertisers) {
      const target = response.data.advertisers.find(a => a.id === 217326);
      if (target) {
        console.log(`✅ Found advertiser 217326: ${target.name}`);
        console.log('Full advertiser data:', JSON.stringify(target, null, 2));
      } else {
        console.log(`❌ Advertiser 217326 not found`);
      }
    }
  } catch (error) {
    console.log(`❌ Broadstreet-api.ts method failed: ${error.message}`);
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

testAPIDirectly().catch(console.error);
