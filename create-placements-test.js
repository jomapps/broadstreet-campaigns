// Create placements using existing API with documented test data
/* eslint-disable no-console */
const axios = require('axios');

const BASE_URL = 'http://localhost:3005';

// From docs/app-docs/placement-logic.md
const TEST_CAMPAIGN_ID = 842383; // numeric Broadstreet ID (mirrored in LocalCampaign.original_broadstreet_id)
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

async function createPlacements() {
  const payload = {
    campaign_id: TEST_CAMPAIGN_ID,
    advertisement_ids: TEST_ADVERTISEMENT_IDS,
    zone_ids: TEST_ZONE_IDS,
  };
  const resp = await axios.post(`${BASE_URL}/api/create/placements`, payload, { timeout: 60000 });
  return resp.data;
}

async function listPlacements(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null) params.set(k, String(v));
  });
  const resp = await axios.get(`${BASE_URL}/api/placements?${params.toString()}`, { timeout: 30000 });
  return resp.data;
}

async function run() {
  console.log('=== Placement Creation Test ===');
  const up = await waitForServer();
  if (!up) {
    console.error('Dev server not reachable at', BASE_URL);
    process.exit(1);
  }

  try {
    const result = await createPlacements();
    console.log('Create response:', result);
    if (typeof result?.created !== 'number') {
      throw new Error('Unexpected response from create placements');
    }
    if (result.created !== TEST_ADVERTISEMENT_IDS.length * TEST_ZONE_IDS.length) {
      console.warn(`Expected ${TEST_ADVERTISEMENT_IDS.length * TEST_ZONE_IDS.length} created, got ${result.created}`);
    }

    // Verify visibility via /api/placements
    const list = await listPlacements({ campaign_id: TEST_CAMPAIGN_ID });
    const placements = Array.isArray(list?.placements) ? list.placements : [];
    const matched = placements.filter(p =>
      TEST_ADVERTISEMENT_IDS.includes(p.advertisement_id) && TEST_ZONE_IDS.includes(p.zone_id)
    );
    console.log(`Found ${matched.length} matching placements in listing (campaign_id filter).`);

    if (matched.length === 0) {
      console.warn('No placements visible via /api/placements yet. Check enrichment or filters.');
    }

    console.log('=== Done ===');
  } catch (e) {
    console.error('Error during placement creation test:', e.response?.data || e.message || e);
    process.exit(1);
  }
}

run();


