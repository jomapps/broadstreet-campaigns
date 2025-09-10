import mongoose from 'mongoose';
import connectDB from './src/lib/mongodb.js';
import LocalZone from './src/lib/models/local-zone.js';
import Zone from './src/lib/models/zone.js';

async function deleteZone() {
  try {
    // Connect to MongoDB using the app's connection function
    await connectDB();
    console.log('Connected to MongoDB');

    const zoneId = '2b15df4d';
    
    // First try to delete from local zones (MongoDB ObjectId)
    let deletedZone = await LocalZone.findByIdAndDelete(zoneId);
    let zoneType = 'local';

    // If not found in local zones, try to find in main zones collection
    if (!deletedZone) {
      // Check if this might be a Broadstreet ID (numeric)
      const numericId = parseInt(zoneId);
      if (!isNaN(numericId)) {
        deletedZone = await Zone.findOneAndDelete({ id: numericId });
        zoneType = 'synced';
      }
    }

    if (!deletedZone) {
      console.log('Zone not found in local or synced collections');
      return;
    }

    console.log(`${zoneType} zone deleted successfully:`, {
      id: deletedZone._id || deletedZone.id,
      name: deletedZone.name,
      type: zoneType,
    });

  } catch (error) {
    console.error('Error deleting zone:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

deleteZone();
