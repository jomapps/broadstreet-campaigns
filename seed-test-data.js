// Seed required test data by syncing from Broadstreet into the local DB when missing
// Uses local API endpoints on http://localhost:3005

 
const axios = require('axios');

const BASE_URL = 'http://localhost:3005';

// Test data from docs/app-docs/placement-logic.md
const TEST_NETWORK_ID = 9396;
const TEST_ADVERTISER_ID = 199901;
const TEST_CAMPAIGN_ID = 842383;
const TEST_ADVERTISEMENT_IDS = [1143797];
const TEST_ZONE_IDS = [182864, 175302, 175301];

async function waitForServer(timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await axios.get(`${BASE_URL}/api/networks`, { timeout: 2000 });
      return true;
    } catch {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  return false;
}

async function advertiserExists(networkId, advertiserId) {
  try {
    const resp = await axios.get(`${BASE_URL}/api/advertisers?network_id=${networkId}`, { timeout: 15000 });
    const list = Array.isArray(resp.data?.advertisers) ? resp.data.advertisers : [];
    return list.some(a => a.id === advertiserId);
  } catch (e) {
    console.warn('[seed] Failed to check advertisers:', e.response?.data || e.message);
    return false;
  }
}

async function campaignExists(advertiserId, campaignId) {
  try {
    const resp = await axios.get(`${BASE_URL}/api/campaigns?advertiser_id=${advertiserId}`, { timeout: 15000 });
    const list = Array.isArray(resp.data?.campaigns) ? resp.data.campaigns : [];
    return list.some(c => c.id === campaignId);
  } catch (e) {
    console.warn('[seed] Failed to check campaigns:', e.response?.data || e.message);
    return false;
  }
}

// Best-effort checks for zones/ads via limited endpoints; if we cannot validate, we will still sync
async function syncAllMirrors() {
  try {
    console.log('[seed] Syncing core mirrors (networks, advertisers, zones, campaigns, advertisements, placements)...');
    const resp = await axios.post(`${BASE_URL}/api/sync/all`, {}, { timeout: 120000 });
    console.log('[seed] /api/sync/all result:', resp.data?.success ? 'success' : 'partial/failure');
  } catch (e) {
    console.warn('[seed] /api/sync/all failed (continuing):', e.response?.data || e.message);
  }
}

async function targetedSync() {
  // These endpoints may be no-ops if there are no local entities pending outbound sync; run as harmless best-effort calls
  try {
    await axios.post(`${BASE_URL}/api/sync/advertisers`, { networkId: TEST_NETWORK_ID }, { timeout: 60000 });
  } catch (e) {
    console.warn('[seed] /api/sync/advertisers warning:', e.response?.data || e.message);
  }
  try {
    await axios.post(`${BASE_URL}/api/sync/zones`, { networkId: TEST_NETWORK_ID }, { timeout: 60000 });
  } catch (e) {
    console.warn('[seed] /api/sync/zones warning:', e.response?.data || e.message);
  }
  try {
    await axios.post(`${BASE_URL}/api/sync/campaigns`, { networkId: TEST_NETWORK_ID }, { timeout: 60000 });
  } catch (e) {
    console.warn('[seed] /api/sync/campaigns warning:', e.response?.data || e.message);
  }
  try {
    await axios.post(`${BASE_URL}/api/sync/advertisements`, {}, { timeout: 60000 });
  } catch (e) {
    console.warn('[seed] /api/sync/advertisements warning:', e.response?.data || e.message);
  }
}

async function main() {
  console.log('=== Seeding Test Data (Placement Flow Prereqs) ===');
  const up = await waitForServer();
  if (!up) {
    console.error('Dev server not reachable at', BASE_URL);
    console.error('Start it with: pnpm dev');
    process.exit(1);
  }

  // Initial mirror sync
  await syncAllMirrors();

  // Check and targeted syncs
  const haveAdvertiser = await advertiserExists(TEST_NETWORK_ID, TEST_ADVERTISER_ID);
  console.log(`[seed] Advertiser ${TEST_ADVERTISER_ID} exists:`, haveAdvertiser);
  if (!haveAdvertiser) {
    console.log('[seed] Targeted sync to ensure advertiser presence...');
    await targetedSync();
  }

  const haveCampaign = await campaignExists(TEST_ADVERTISER_ID, TEST_CAMPAIGN_ID);
  console.log(`[seed] Campaign ${TEST_CAMPAIGN_ID} exists:`, haveCampaign);
  if (!haveCampaign) {
    console.log('[seed] Targeted sync to ensure campaign presence...');
    await targetedSync();
  }

  // Ensure LocalCampaign mirror exists for numeric campaign
  try {
    console.log('[seed] Ensuring LocalCampaign mirror exists...');
    await axios.post(`${BASE_URL}/api/local-campaigns/mirror`, { campaign_id: TEST_CAMPAIGN_ID }, { timeout: 30000 });
  } catch (e) {
    console.warn('[seed] Mirror upsert warning:', e.response?.data || e.message);
  }

  // We cannot directly list zones/ads via a public endpoint; ensure refreshed via sync
  console.log('[seed] Ensuring zones and advertisements are mirrored locally...');
  await targetedSync();

  console.log('\n=== Seed Complete ===');
  console.log('Network:', TEST_NETWORK_ID);
  console.log('Advertiser:', TEST_ADVERTISER_ID);
  console.log('Campaign:', TEST_CAMPAIGN_ID);
  console.log('Advertisement IDs:', TEST_ADVERTISEMENT_IDS.join(', '));
  console.log('Zone IDs:', TEST_ZONE_IDS.join(', '));
}

main().catch(err => {
  console.error('Seed error:', err?.response?.data || err?.message || err);
  process.exit(1);
});


