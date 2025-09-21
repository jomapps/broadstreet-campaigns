#!/usr/bin/env node

import mongoose from 'mongoose';
import { loadEnv } from './load-env.mjs';

// Load environment variables
loadEnv();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  console.error('   Make sure .env.local exists with MONGODB_URI defined');
  process.exit(1);
}

// Collection names based on the codebase analysis
const COLLECTIONS_TO_SEARCH = [
  'campaigns',           // Main synced campaigns
  'localcampaigns',      // Local-only campaigns
  'placements',          // Contains campaign_id and campaign_mongo_id references
  'advertisements',      // Might have campaign references
  'localadvertisements', // Local advertisements
  'zones',              // Might have campaign references
  'localzones',         // Local zones
  'advertisers',        // Might have campaign references
  'localadvertisers',   // Local advertisers
  'networks',           // Networks
  'localnetworks',      // Local networks
  'themes'              // Themes might reference campaigns indirectly
];

// Fields to search for the campaign ID
const SEARCH_FIELDS = [
  '_id',                 // MongoDB ObjectId
  'broadstreet_id',      // Broadstreet API ID
  'campaign_id',         // Direct campaign reference
  'campaign_mongo_id',   // MongoDB campaign reference
  'id'                   // Generic ID field
];

async function findCampaignById(searchId) {
  console.log(`🔍 Searching for campaign ID: ${searchId}`);
  console.log(`📊 Database: ${MONGODB_URI.replace(/\/\/.*@/, '//***@')}`);
  console.log('─'.repeat(80));

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, { bufferCommands: false });
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    let totalFound = 0;
    let foundInCollections = [];

    // First, let's check what collections actually exist and have data
    console.log('\n📋 Database Overview:');
    const collections = await db.listCollections().toArray();
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`   ${col.name}: ${count} documents`);
    }

    // Search in each collection
    for (const collectionName of COLLECTIONS_TO_SEARCH) {
      try {
        const collection = db.collection(collectionName);

        // Check if collection exists
        const collectionCount = await collection.countDocuments();
        if (collectionCount === 0) {
          console.log(`⚪ ${collectionName}: Collection empty or doesn't exist`);
          continue;
        }

        console.log(`\n🔎 Searching in collection: ${collectionName} (${collectionCount} documents)`);

        let foundInThisCollection = 0;
        
        // Search for the ID in various fields
        for (const field of SEARCH_FIELDS) {
          // Try as string
          const stringQuery = { [field]: searchId };
          const stringResults = await collection.find(stringQuery).toArray();

          // Try as number (if searchId can be converted to number)
          let numberResults = [];
          const numericId = parseInt(searchId, 10);
          if (!isNaN(numericId) && numericId.toString() === searchId) {
            const numberQuery = { [field]: numericId };
            numberResults = await collection.find(numberQuery).toArray();
          }

          // Try as ObjectId (if searchId looks like a valid ObjectId)
          let objectIdResults = [];
          if (mongoose.Types.ObjectId.isValid(searchId)) {
            try {
              const objectIdQuery = { [field]: new mongoose.Types.ObjectId(searchId) };
              objectIdResults = await collection.find(objectIdQuery).toArray();
            } catch (e) {
              // Invalid ObjectId format, skip
            }
          }

          // Try partial string match for text fields like name, notes
          let partialResults = [];
          if (field === 'name' || field === 'notes' || field === 'path') {
            const partialQuery = { [field]: { $regex: searchId, $options: 'i' } };
            partialResults = await collection.find(partialQuery).toArray();
          }

          // Combine all results (remove duplicates by _id)
          const allResults = [...stringResults, ...numberResults, ...objectIdResults, ...partialResults];
          const uniqueResults = allResults.filter((doc, index, self) =>
            index === self.findIndex(d => d._id.toString() === doc._id.toString())
          );

          if (uniqueResults.length > 0) {
            console.log(`  ✅ Found ${uniqueResults.length} match(es) in field: ${field}`);
            foundInThisCollection += uniqueResults.length;
            
            // Display each result
            uniqueResults.forEach((doc, index) => {
              console.log(`\n    📄 Document ${index + 1}:`);
              console.log(`       MongoDB _id: ${doc._id}`);
              
              // Show key identifying fields
              if (doc.broadstreet_id) console.log(`       Broadstreet ID: ${doc.broadstreet_id}`);
              if (doc.name) console.log(`       Name: ${doc.name}`);
              if (doc.campaign_id) console.log(`       Campaign ID: ${doc.campaign_id}`);
              if (doc.campaign_mongo_id) console.log(`       Campaign Mongo ID: ${doc.campaign_mongo_id}`);
              if (doc.advertiser_id) console.log(`       Advertiser ID: ${doc.advertiser_id}`);
              if (doc.network_id) console.log(`       Network ID: ${doc.network_id}`);
              if (doc.active !== undefined) console.log(`       Active: ${doc.active}`);
              if (doc.start_date) console.log(`       Start Date: ${doc.start_date}`);
              if (doc.end_date) console.log(`       End Date: ${doc.end_date}`);
              if (doc.created_locally !== undefined) console.log(`       Created Locally: ${doc.created_locally}`);
              if (doc.synced_with_api !== undefined) console.log(`       Synced with API: ${doc.synced_with_api}`);
              
              console.log(`\n       📋 Full Document:`);
              console.log(JSON.stringify(doc, null, 2));
            });
          }
        }
        
        if (foundInThisCollection > 0) {
          foundInCollections.push({ collection: collectionName, count: foundInThisCollection });
          totalFound += foundInThisCollection;
        } else {
          console.log(`  ❌ No matches found`);
        }
        
      } catch (error) {
        console.log(`  ⚠️  Error searching ${collectionName}: ${error.message}`);
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 SEARCH SUMMARY');
    console.log('='.repeat(80));
    
    if (totalFound === 0) {
      console.log(`❌ Campaign ID "${searchId}" not found in any collection`);
      console.log('\n💡 Suggestions:');
      console.log('   • Check if the ID is correct');
      console.log('   • Try searching with different ID formats (string vs number)');
      console.log('   • The campaign might have been deleted or not synced yet');
    } else {
      console.log(`✅ Found ${totalFound} total matches across ${foundInCollections.length} collections:`);
      foundInCollections.forEach(({ collection, count }) => {
        console.log(`   • ${collection}: ${count} match(es)`);
      });
    }
    
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('❌ Usage: node find-campaign.mjs <campaign-id>');
    console.log('\nExample:');
    console.log('  node find-campaign.mjs 68cf3251fe8be49e7b9198f0');
    console.log('  node find-campaign.mjs 12345');
    process.exit(1);
  }
  
  const campaignId = args[0];
  await findCampaignById(campaignId);
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main().catch(console.error);
