const mongoose = require('mongoose');
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

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI environment variable is required');
  process.exit(1);
}

console.log('🧪 Testing Local-Only Page Queries (Simulating Server-Side Rendering)');
console.log('📍 MongoDB URI:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
console.log('');

async function testLocalOnlyQueries() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, { bufferCommands: false });
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Simulate the exact queries from LocalOnlyDataWrapper
    console.log('\n🔍 Running Local-Only Page Queries:');
    
    // 1. LocalZone.find({ synced_with_api: false })
    const localZones = await db.collection('localzones').find({ synced_with_api: false }).sort({ created_at: -1 }).toArray();
    console.log(`  📊 LocalZones (unsynced): ${localZones.length}`);
    
    // 2. LocalAdvertiser.find({ synced_with_api: false })
    const localAdvertisers = await db.collection('localadvertisers').find({ synced_with_api: false }).sort({ created_at: -1 }).toArray();
    console.log(`  📊 LocalAdvertisers (unsynced): ${localAdvertisers.length}`);
    
    // 3. LocalCampaign.find({ $or: [ { synced_with_api: false }, { 'placements.0': { $exists: true } } ] })
    const localCampaigns = await db.collection('localcampaigns').find({ 
      $or: [ 
        { synced_with_api: false }, 
        { 'placements.0': { $exists: true } } 
      ] 
    }).sort({ created_at: -1 }).toArray();
    console.log(`  📊 LocalCampaigns (unsynced OR with placements): ${localCampaigns.length}`);
    
    // 4. LocalNetwork.find({ synced_with_api: false })
    const localNetworks = await db.collection('localnetworks').find({ synced_with_api: false }).sort({ created_at: -1 }).toArray();
    console.log(`  📊 LocalNetworks (unsynced): ${localNetworks.length}`);
    
    // 5. LocalAdvertisement.find({ synced_with_api: false })
    const localAdvertisements = await db.collection('localadvertisements').find({ synced_with_api: false }).sort({ created_at: -1 }).toArray();
    console.log(`  📊 LocalAdvertisements (unsynced): ${localAdvertisements.length}`);
    
    // 6. Placement.find({ created_locally: true, synced_with_api: false })
    const localPlacements = await db.collection('placements').find({ 
      created_locally: true, 
      synced_with_api: false 
    }).sort({ created_at: -1 }).toArray();
    console.log(`  📊 Placements (local & unsynced): ${localPlacements.length}`);
    
    // 7. Advertiser.find({ synced_with_api: false, created_locally: true })
    const mainLocalAdvertisers = await db.collection('advertisers').find({ 
      synced_with_api: false,
      created_locally: true 
    }).sort({ created_at: -1 }).toArray();
    console.log(`  📊 Main Advertisers (local & unsynced): ${mainLocalAdvertisers.length}`);
    
    console.log('\n📋 Summary of what Local-Only page should show:');
    const totalEntities = localZones.length + localAdvertisers.length + localCampaigns.length + 
                         localNetworks.length + localAdvertisements.length + localPlacements.length + 
                         mainLocalAdvertisers.length;
    
    console.log(`  🎯 Total entities that should appear: ${totalEntities}`);
    
    if (totalEntities === 0) {
      console.log('  ❌ No entities found - this explains why the page is empty!');
    } else {
      console.log('  ✅ Entities found - page should show content');
      
      // Show details of found entities
      if (localCampaigns.length > 0) {
        console.log(`\n  📋 Campaign Details:`);
        localCampaigns.forEach((campaign, idx) => {
          console.log(`    ${idx + 1}. ${campaign.name} (ID: ${campaign._id})`);
          console.log(`       synced_with_api: ${campaign.synced_with_api}`);
          console.log(`       created_locally: ${campaign.created_locally}`);
          console.log(`       placements: ${campaign.placements?.length || 0}`);
        });
      }
      
      if (localPlacements.length > 0) {
        console.log(`\n  📋 Placement Details (showing first 3):`);
        localPlacements.slice(0, 3).forEach((placement, idx) => {
          console.log(`    ${idx + 1}. ID: ${placement._id}`);
          console.log(`       network_id: ${placement.network_id}`);
          console.log(`       advertiser_id: ${placement.advertiser_id}`);
          console.log(`       advertisement_id: ${placement.advertisement_id}`);
          console.log(`       campaign_id: ${placement.campaign_id || 'N/A'}`);
          console.log(`       campaign_mongo_id: ${placement.campaign_mongo_id || 'N/A'}`);
          console.log(`       zone_id: ${placement.zone_id || 'N/A'}`);
          console.log(`       zone_mongo_id: ${placement.zone_mongo_id || 'N/A'}`);
          console.log(`       created_locally: ${placement.created_locally}`);
          console.log(`       synced_with_api: ${placement.synced_with_api}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testLocalOnlyQueries();
