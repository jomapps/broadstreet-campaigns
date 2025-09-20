const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const BASE_URL = 'http://localhost:3005';

async function testDeleteAllLocal() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, { bufferCommands: false });
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Check counts before deletion
    console.log('\n📊 BEFORE DELETION:');
    const beforeCounts = {
      localZones: await db.collection('localzones').countDocuments({ synced_with_api: false }),
      localAdvertisers: await db.collection('localadvertisers').countDocuments({ synced_with_api: false }),
      localCampaigns: await db.collection('localcampaigns').countDocuments({ synced_with_api: false }),
      localNetworks: await db.collection('localnetworks').countDocuments({ synced_with_api: false }),
      localAdvertisements: await db.collection('localadvertisements').countDocuments({ synced_with_api: false }),
      standalonePlacements: await db.collection('placements').countDocuments({ created_locally: true, synced_with_api: false }),
    };
    
    // Count embedded placements
    const campaignsWithPlacements = await db.collection('localcampaigns').find({
      'placements.0': { $exists: true }
    }).toArray();
    
    const embeddedPlacementsCount = campaignsWithPlacements.reduce((total, campaign) => {
      return total + (Array.isArray(campaign.placements) ? campaign.placements.length : 0);
    }, 0);
    
    console.log('  Local Zones:', beforeCounts.localZones);
    console.log('  Local Advertisers:', beforeCounts.localAdvertisers);
    console.log('  Local Campaigns:', beforeCounts.localCampaigns);
    console.log('  Local Networks:', beforeCounts.localNetworks);
    console.log('  Local Advertisements:', beforeCounts.localAdvertisements);
    console.log('  Standalone Placements:', beforeCounts.standalonePlacements);
    console.log('  Embedded Placements:', embeddedPlacementsCount);
    console.log('  TOTAL ENTITIES:', Object.values(beforeCounts).reduce((a, b) => a + b, 0) + embeddedPlacementsCount);
    
    // Call the delete API
    console.log('\n🗑️  Calling DELETE /api/delete/local-all...');
    const response = await axios.delete(`${BASE_URL}/api/delete/local-all`);
    console.log('✅ Delete API response:', response.data);
    
    // Check counts after deletion
    console.log('\n📊 AFTER DELETION:');
    const afterCounts = {
      localZones: await db.collection('localzones').countDocuments({ synced_with_api: false }),
      localAdvertisers: await db.collection('localadvertisers').countDocuments({ synced_with_api: false }),
      localCampaigns: await db.collection('localcampaigns').countDocuments({ synced_with_api: false }),
      localNetworks: await db.collection('localnetworks').countDocuments({ synced_with_api: false }),
      localAdvertisements: await db.collection('localadvertisements').countDocuments({ synced_with_api: false }),
      standalonePlacements: await db.collection('placements').countDocuments({ created_locally: true, synced_with_api: false }),
    };
    
    // Count embedded placements after deletion
    const campaignsWithPlacementsAfter = await db.collection('localcampaigns').find({
      'placements.0': { $exists: true }
    }).toArray();
    
    const embeddedPlacementsCountAfter = campaignsWithPlacementsAfter.reduce((total, campaign) => {
      return total + (Array.isArray(campaign.placements) ? campaign.placements.length : 0);
    }, 0);
    
    console.log('  Local Zones:', afterCounts.localZones);
    console.log('  Local Advertisers:', afterCounts.localAdvertisers);
    console.log('  Local Campaigns:', afterCounts.localCampaigns);
    console.log('  Local Networks:', afterCounts.localNetworks);
    console.log('  Local Advertisements:', afterCounts.localAdvertisements);
    console.log('  Standalone Placements:', afterCounts.standalonePlacements);
    console.log('  Embedded Placements:', embeddedPlacementsCountAfter);
    console.log('  TOTAL ENTITIES:', Object.values(afterCounts).reduce((a, b) => a + b, 0) + embeddedPlacementsCountAfter);
    
    // Verify deletion worked
    const totalBefore = Object.values(beforeCounts).reduce((a, b) => a + b, 0) + embeddedPlacementsCount;
    const totalAfter = Object.values(afterCounts).reduce((a, b) => a + b, 0) + embeddedPlacementsCountAfter;
    
    console.log('\n🎯 RESULTS:');
    console.log(`  Entities before: ${totalBefore}`);
    console.log(`  Entities after: ${totalAfter}`);
    console.log(`  Deleted: ${totalBefore - totalAfter}`);
    
    if (totalAfter === 0) {
      console.log('✅ SUCCESS: All local entities deleted!');
    } else {
      console.log('❌ ISSUE: Some entities remain after deletion');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testDeleteAllLocal();
