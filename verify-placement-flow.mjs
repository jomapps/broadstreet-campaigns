// Comprehensive verification of placement creation & visibility flow
import axios from 'axios';

const BASE_URL = 'http://localhost:3005';
const NETWORK_ID = 9396;
const ADVERTISER_ID = 199901;
const CAMPAIGN_ID = 842383;
const AD_IDS = [1143797];
const ZONE_IDS = [182864, 175302, 175301];

async function ping() {
  try {
    await axios.get(`${BASE_URL}/api/networks`, { timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

async function ensurePrereqs() {
  const report = { server: false, dataSeeded: false, details: {} };
  report.server = await ping();
  if (!report.server) return report;

  // Run seeding script endpoints
  try {
    const syncAll = await axios.post(`${BASE_URL}/api/sync/all`, {}, { timeout: 180000 });
    report.details.syncAll = syncAll.data;
  } catch (e) {
    report.details.syncAllError = e.response?.data || e.message;
  }
  try {
    const adv = await axios.get(`${BASE_URL}/api/advertisers?networkId=${NETWORK_ID}`, { timeout: 30000 });
    report.details.advertisers = adv.data?.advertisers?.length ?? 0;
    report.details.hasAdvertiser = (adv.data?.advertisers || []).some((a) => a.id === ADVERTISER_ID);
  } catch (e) {
    report.details.advertisersError = e.response?.data || e.message;
  }
  try {
    const camps = await axios.get(`${BASE_URL}/api/campaigns?advertiserId=${ADVERTISER_ID}`, { timeout: 30000 });
    report.details.campaigns = camps.data?.campaigns?.length ?? 0;
    report.details.hasCampaign = (camps.data?.campaigns || []).some((c) => c.id === CAMPAIGN_ID);
  } catch (e) {
    report.details.campaignsError = e.response?.data || e.message;
  }

  report.dataSeeded = Boolean(report.details.hasAdvertiser && report.details.hasCampaign);
  return report;
}

async function createPlacements() {
  const payload = {
    campaignId: CAMPAIGN_ID,
    advertisementIds: AD_IDS,
    zoneIds: ZONE_IDS,
  };
  try {
    const resp = await axios.post(`${BASE_URL}/api/create/placements`, payload, { timeout: 60000 });
    return { success: true, data: resp.data };
  } catch (e) {
    return { success: false, error: e.response?.data || e.message };
  }
}

async function fetchPlacements() {
  try {
    const list = await axios.get(`${BASE_URL}/api/placements?campaignId=${CAMPAIGN_ID}`, { timeout: 30000 });
    return { success: true, count: list.data?.count, placements: list.data?.placements };
  } catch (e) {
    return { success: false, error: e.response?.data || e.message };
  }
}

async function fetchLocalEntities() {
  try {
    const resp = await axios.get(`${BASE_URL}/api/local-entities`, { timeout: 30000 });
    return { success: true, data: resp.data };
  } catch (e) {
    return { success: false, error: e.response?.data || e.message };
  }
}

async function run() {
  console.log('=== Verify Placement Flow ===');
  const prereq = await ensurePrereqs();
  console.log('[verify] Server up:', prereq.server);
  console.log('[verify] Has advertiser/campaign:', prereq.details?.hasAdvertiser, prereq.details?.hasCampaign);

  const created = await createPlacements();
  console.log('[verify] Create placements:', created);

  const list = await fetchPlacements();
  if (list.success) {
    const matched = (list.placements || []).filter((p) => AD_IDS.includes(p.advertisement_id) && ZONE_IDS.includes(p.zone_id));
    console.log(`[verify] /api/placements returned ${list.count}; matched=${matched.length}`);
  } else {
    console.warn('[verify] placements list failed:', list.error);
  }

  const local = await fetchLocalEntities();
  if (local.success) {
    const findCamp = (local.data?.campaigns || []).find((c) => c.original_broadstreet_id === CAMPAIGN_ID || c.id === String(CAMPAIGN_ID));
    console.log('[verify] local-only campaigns count:', local.data?.campaigns?.length ?? 0, 'found target:', Boolean(findCamp));
  } else {
    console.warn('[verify] local entities failed:', local.error);
  }

  console.log('=== Done ===');
}

run().catch((e) => {
  console.error('Verification error:', e?.response?.data || e.message || e);
  process.exit(1);
});

