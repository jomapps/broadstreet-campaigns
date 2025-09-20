import mongoose from 'mongoose';

// Simple MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/broadstreet-campaigns';

async function deleteZoneByName(zoneName) {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    
    console.log(`\nSearching for zone with name: "${zoneName}"`);
    
    // Search in local zones collection
    console.log('\n=== Searching Local Zones ===');
    const localZones = await db.collection('localzones').find({ name: zoneName }).toArray();
    console.log(`Found ${localZones.length} local zones with name "${zoneName}"`);
    
    localZones.forEach(zone => {
      console.log(`Local Zone - ID: ${zone._id}, Name: ${zone.name}, Synced: ${zone.synced_with_api}`);
    });

    // Search in main zones collection
    console.log('\n=== Searching Main Zones ===');
    const mainZones = await db.collection('zones').find({ name: zoneName }).toArray();
    console.log(`Found ${mainZones.length} main zones with name "${zoneName}"`);
    
    mainZones.forEach(zone => {
      console.log(`Main Zone - ID: ${zone._id}, Broadstreet ID: ${zone.id}, Name: ${zone.name}`);
    });

    // Delete from local zones
    if (localZones.length > 0) {
      console.log('\n=== Deleting from Local Zones ===');
      const localDeleteResult = await db.collection('localzones').deleteMany({ name: zoneName });
      console.log(`Deleted ${localDeleteResult.deletedCount} local zones`);
    }

    // Delete from main zones
    if (mainZones.length > 0) {
      console.log('\n=== Deleting from Main Zones ===');
      const mainDeleteResult = await db.collection('zones').deleteMany({ name: zoneName });
      console.log(`Deleted ${mainDeleteResult.deletedCount} main zones`);
    }

    if (localZones.length === 0 && mainZones.length === 0) {
      console.log(`\nNo zones found with name "${zoneName}"`);
    } else {
      console.log(`\nSuccessfully deleted all zones with name "${zoneName}"`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Get zone name from command line arguments
const zoneName = process.argv[2];

if (!zoneName) {
  console.log('Usage: node delete-zone-by-name.mjs "Zone Name"');
  console.log('Example: node delete-zone-by-name.mjs "Leo API Test"');
  process.exit(1);
}

deleteZoneByName(zoneName);

