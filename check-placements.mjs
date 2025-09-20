import 'dotenv/config';
import { MongoClient } from 'mongodb';

async function checkPlacements() {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const placements = db.collection('placements');
    const localCampaigns = db.collection('localcampaigns');
    const campaigns = db.collection('campaigns');

    // Get all placements from Placement collection
    const allPlacements = await placements.find({}).toArray();
    console.log(`\n=== ALL PLACEMENTS COLLECTION (${allPlacements.length}) ===`);

    allPlacements.forEach((placement, index) => {
      console.log(`${index + 1}. ID: ${placement._id}`);
      console.log(`   Campaign ID: ${placement.campaign_broadstreet_id || placement.campaign_mongo_id || 'N/A'}`);
      console.log(`   Zone ID: ${placement.zone_broadstreet_id || placement.zone_mongo_id || 'N/A'}`);
      console.log(`   Advertisement ID: ${placement.advertisement_broadstreet_id || placement.advertisement_mongo_id || 'N/A'}`);
      console.log(`   Created: ${placement.created_at || 'N/A'}`);
      console.log('');
    });

    // Check LocalCampaigns for embedded placements
    const allLocalCampaigns = await localCampaigns.find({}).toArray();
    console.log(`\n=== LOCAL CAMPAIGNS WITH PLACEMENTS (${allLocalCampaigns.length}) ===`);

    allLocalCampaigns.forEach((campaign, index) => {
      console.log(`${index + 1}. Campaign ID: ${campaign._id}`);
      console.log(`   Name: ${campaign.name}`);
      console.log(`   Original Broadstreet ID: ${campaign.original_broadstreet_id || 'N/A'}`);
      console.log(`   Placements: ${campaign.placements ? campaign.placements.length : 0}`);

      if (campaign.placements && campaign.placements.length > 0) {
        campaign.placements.forEach((placement, pIndex) => {
          console.log(`     ${pIndex + 1}. Ad: ${placement.advertisement_id}, Zone: ${placement.zone_id || placement.zone_mongo_id}`);
        });
      }
      console.log('');
    });

    // Check synced campaigns for embedded placements
    const syncedCampaign = await campaigns.findOne({ broadstreet_id: 846562 });
    console.log(`\n=== SYNCED CAMPAIGN 846562 ===`);
    if (syncedCampaign) {
      console.log(`Campaign ID: ${syncedCampaign._id}`);
      console.log(`Name: ${syncedCampaign.name}`);
      console.log(`Broadstreet ID: ${syncedCampaign.broadstreet_id}`);
      console.log(`Placements: ${syncedCampaign.placements ? syncedCampaign.placements.length : 0}`);

      if (syncedCampaign.placements && syncedCampaign.placements.length > 0) {
        syncedCampaign.placements.forEach((placement, pIndex) => {
          console.log(`  ${pIndex + 1}. Ad: ${placement.advertisement_id}, Zone: ${placement.zone_id || placement.zone_mongo_id}`);
        });
      }
    } else {
      console.log('Campaign 846562 not found in synced campaigns');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkPlacements();

