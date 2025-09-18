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

console.log('🧪 Testing Production Database Connection');
console.log('📍 MongoDB URI:', MONGODB_URI ? MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') : 'NOT SET');
console.log('');

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI environment variable is required');
  console.error('Please ensure MONGODB_URI is set in .env.local file');
  process.exit(1);
}

async function testProductionDB() {
  try {
    console.log('🔌 Attempting to connect to production MongoDB...');
    
    // Set a connection timeout
    const connectionOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      connectTimeoutMS: 10000,
      socketTimeoutMS: 10000,
    };
    
    await mongoose.connect(MONGODB_URI, connectionOptions);
    console.log('✅ Successfully connected to production MongoDB!');
    
    const db = mongoose.connection.db;
    
    // Test basic database operations
    console.log('\n📊 Database Information:');
    console.log(`  Database Name: ${db.databaseName}`);
    
    // List all collections
    console.log('\n📋 Available Collections:');
    const collections = await db.listCollections().toArray();
    collections.forEach(col => {
      console.log(`  - ${col.name}`);
    });
    
    // Check each relevant collection for local entities
    const collectionsToCheck = [
      'localzones',
      'localadvertisers', 
      'localcampaigns',
      'localnetworks',
      'localadvertisements',
      'placements',
      'advertisers'
    ];
    
    console.log('\n🔍 Checking Local Entities in Production:');
    
    for (const collectionName of collectionsToCheck) {
      if (collections.find(c => c.name === collectionName)) {
        const collection = db.collection(collectionName);
        
        // Total count
        const totalCount = await collection.countDocuments();
        
        // Local entities count
        let localCount = 0;
        let unsyncedCount = 0;
        
        if (collectionName === 'placements') {
          localCount = await collection.countDocuments({ created_locally: true });
          unsyncedCount = await collection.countDocuments({ 
            created_locally: true, 
            synced_with_api: false 
          });
        } else if (collectionName === 'advertisers') {
          localCount = await collection.countDocuments({ created_locally: true });
          unsyncedCount = await collection.countDocuments({ 
            created_locally: true, 
            synced_with_api: false 
          });
        } else {
          // Local* collections
          localCount = totalCount; // All are local
          unsyncedCount = await collection.countDocuments({ synced_with_api: false });
        }
        
        console.log(`  📊 ${collectionName}:`);
        console.log(`     Total: ${totalCount}`);
        console.log(`     Local: ${localCount}`);
        console.log(`     Unsynced: ${unsyncedCount}`);
        
        // Show sample documents if any exist
        if (unsyncedCount > 0) {
          let sampleQuery = {};
          if (collectionName === 'placements' || collectionName === 'advertisers') {
            sampleQuery = { created_locally: true, synced_with_api: false };
          } else {
            sampleQuery = { synced_with_api: false };
          }
          
          const samples = await collection.find(sampleQuery).limit(2).toArray();
          console.log(`     Sample documents:`);
          samples.forEach((doc, idx) => {
            console.log(`       ${idx + 1}. ID: ${doc._id}, Name: ${doc.name || 'N/A'}`);
            console.log(`          created_locally: ${doc.created_locally}`);
            console.log(`          synced_with_api: ${doc.synced_with_api}`);
            if (doc.created_at) {
              console.log(`          created_at: ${doc.created_at}`);
            }
          });
        }
        console.log('');
      } else {
        console.log(`  ❌ ${collectionName}: Collection not found`);
      }
    }
    
    // Special check for campaigns with placements
    if (collections.find(c => c.name === 'localcampaigns')) {
      const campaignsCollection = db.collection('localcampaigns');
      const campaignsWithPlacements = await campaignsCollection.countDocuments({
        'placements.0': { $exists: true }
      });
      console.log(`🎯 LocalCampaigns with embedded placements: ${campaignsWithPlacements}`);
      
      if (campaignsWithPlacements > 0) {
        const sampleCampaigns = await campaignsCollection.find({
          'placements.0': { $exists: true }
        }).limit(2).toArray();
        
        sampleCampaigns.forEach((campaign, idx) => {
          console.log(`   ${idx + 1}. Campaign: ${campaign.name} (ID: ${campaign._id})`);
          console.log(`      Placements count: ${campaign.placements?.length || 0}`);
          console.log(`      synced_with_api: ${campaign.synced_with_api}`);
        });
      }
    }
    
    // Summary
    console.log('\n📋 Production Database Summary:');
    let totalLocalEntities = 0;
    
    for (const collectionName of collectionsToCheck) {
      if (collections.find(c => c.name === collectionName)) {
        const collection = db.collection(collectionName);
        let count = 0;
        
        if (collectionName === 'placements' || collectionName === 'advertisers') {
          count = await collection.countDocuments({ 
            created_locally: true, 
            synced_with_api: false 
          });
        } else {
          count = await collection.countDocuments({ synced_with_api: false });
        }
        
        totalLocalEntities += count;
      }
    }
    
    console.log(`  🎯 Total local entities that should appear on local-only page: ${totalLocalEntities}`);
    
    if (totalLocalEntities === 0) {
      console.log('  ❌ NO LOCAL ENTITIES FOUND - This explains why the production local-only page is empty!');
      console.log('  💡 The production database does not contain the same local entities as development.');
    } else {
      console.log('  ✅ Local entities found - production page should show content');
    }
    
  } catch (error) {
    console.error('❌ Connection Error:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('💡 The database server is not reachable. Check:');
      console.error('   - Network connectivity');
      console.error('   - Firewall settings');
      console.error('   - Database server is running');
    } else if (error.message.includes('Authentication failed')) {
      console.error('💡 Authentication failed. Check:');
      console.error('   - Username and password are correct');
      console.error('   - User has proper permissions');
    } else if (error.message.includes('timeout')) {
      console.error('💡 Connection timeout. Check:');
      console.error('   - Network latency');
      console.error('   - Database server performance');
      console.error('   - Connection string format');
    }
    
    console.error('\nFull error details:', error);
  } finally {
    try {
      await mongoose.disconnect();
      console.log('\n🔌 Disconnected from MongoDB');
    } catch (disconnectError) {
      console.error('Error disconnecting:', disconnectError.message);
    }
  }
}

testProductionDB();
