const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/broadstreet-campaigns';

async function debugCampaigns() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, { bufferCommands: false });
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    console.log('\n=== LOCAL CAMPAIGNS (unsynced) ===');
    const localCampaigns = await db.collection('localcampaigns').find({ synced_with_api: false }).toArray();
    console.log(`Count: ${localCampaigns.length}`);
    localCampaigns.forEach((c, idx) => {
      console.log(`${idx + 1}. ${c.name}`);
      console.log(`   Network ID: ${c.network_id}`);
      console.log(`   Advertiser ID: ${c.advertiser_id} (type: ${typeof c.advertiser_id})`);
      console.log(`   Synced: ${c.synced_with_api}`);
      console.log(`   Created Locally: ${c.created_locally}`);
      console.log('');
    });
    
    console.log('\n=== SYNCED CAMPAIGNS ===');
    const syncedCampaigns = await db.collection('campaigns').find({}).toArray();
    console.log(`Count: ${syncedCampaigns.length}`);
    syncedCampaigns.forEach((c, idx) => {
      console.log(`${idx + 1}. ${c.name}`);
      console.log(`   Network ID: ${c.network_id}`);
      console.log(`   Advertiser ID: ${c.advertiser_id} (type: ${typeof c.advertiser_id})`);
      console.log(`   Broadstreet ID: ${c.broadstreet_id}`);
      console.log('');
    });
    
    console.log('\n=== NETWORKS ===');
    const networks = await db.collection('networks').find({}).toArray();
    console.log(`Count: ${networks.length}`);
    networks.forEach((n, idx) => {
      console.log(`${idx + 1}. ${n.name}`);
      console.log(`   Broadstreet ID: ${n.broadstreet_id}`);
      console.log('');
    });
    
    console.log('\n=== ADVERTISERS ===');
    const advertisers = await db.collection('advertisers').find({}).toArray();
    console.log(`Count: ${advertisers.length}`);
    advertisers.forEach((a, idx) => {
      console.log(`${idx + 1}. ${a.name}`);
      console.log(`   Broadstreet ID: ${a.broadstreet_id}`);
      console.log(`   Network ID: ${a.network_id}`);
      console.log('');
    });
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugCampaigns();
