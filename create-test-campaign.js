const mongoose = require('mongoose');

// Define LocalCampaign schema
const LocalCampaignSchema = new mongoose.Schema({
  name: { type: String, required: true },
  network_id: { type: Number, required: true },
  advertiser_id: { type: Number, required: true },
  start_date: { type: Date, required: true },
  end_date: { type: Date },
  weight: { type: Number, default: 1 },
  active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const LocalCampaign = mongoose.model('LocalCampaign', LocalCampaignSchema);

async function createTestCampaign() {
  try {
    // Connect to MongoDB
    const mongoUri = 'mongodb://localhost:27017/broadstreet-campaigns';
    console.log('Connecting to MongoDB:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Create a test campaign
    const testCampaign = new LocalCampaign({
      name: 'Test Placement Campaign',
      network_id: 9396, // SCHWULISSIMO network ID
      advertiser_id: 217326, // Affwin | Lottobay advertiser ID
      start_date: new Date(),
      weight: 1,
      active: true
    });

    const savedCampaign = await testCampaign.save();
    console.log('Test campaign created successfully:');
    console.log('Campaign ID:', savedCampaign._id.toString());
    console.log('Campaign Name:', savedCampaign.name);
    console.log('Network ID:', savedCampaign.network_id);
    console.log('Advertiser ID:', savedCampaign.advertiser_id);

    // Verify the campaign exists
    const foundCampaign = await LocalCampaign.findById(savedCampaign._id);
    console.log('Verification - Campaign found:', foundCampaign ? 'YES' : 'NO');

    // List all local campaigns
    const allCampaigns = await LocalCampaign.find({});
    console.log('Total local campaigns in database:', allCampaigns.length);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');

  } catch (error) {
    console.error('Error creating test campaign:', error);
    process.exit(1);
  }
}

createTestCampaign();
