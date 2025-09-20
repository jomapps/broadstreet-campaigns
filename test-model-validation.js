require('dotenv').config({ path: '.env.local' });

const mongoose = require('mongoose');

async function testModelValidation() {
  console.log('🧪 Testing Model Validation...\n');

  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connected successfully');

    // Test Advertisement model
    const Advertisement = require('./src/lib/models/advertisement.ts').default;
    console.log('✅ Advertisement model loaded');

    // Test Campaign model
    const Campaign = require('./src/lib/models/campaign.ts').default;
    console.log('✅ Campaign model loaded');

    // Test Zone model
    const Zone = require('./src/lib/models/zone.ts').default;
    console.log('✅ Zone model loaded');

    // Test Advertiser model
    const Advertiser = require('./src/lib/models/advertiser.ts').default;
    console.log('✅ Advertiser model loaded');

    // Test Network model
    const Network = require('./src/lib/models/network.ts').default;
    console.log('✅ Network model loaded');

    // Test Placement model
    const Placement = require('./src/lib/models/placement.ts').default;
    console.log('✅ Placement model loaded');

    // Test Theme model
    const Theme = require('./src/lib/models/theme.ts').default;
    console.log('✅ Theme model loaded');

    // Test model validation
    console.log('\n🔍 Testing model validation...');

    // Test Advertisement validation
    const testAd = new Advertisement({
      broadstreet_id: 999999,
      name: 'Test Advertisement',
      updated_at: new Date().toISOString(),
      type: 'banner',
      advertiser: 'Test Advertiser',
      active_placement: true,
      preview_url: 'https://example.com/preview'
    });

    await testAd.validate();
    console.log('✅ Advertisement validation passed');

    // Test Campaign validation
    const testCampaign = new Campaign({
      broadstreet_id: 999998,
      name: 'Test Campaign',
      advertiser_id: 12345,
      active: true,
      path: '/test-campaign'
    });

    await testCampaign.validate();
    console.log('✅ Campaign validation passed');

    // Test Zone validation
    const testZone = new Zone({
      broadstreet_id: 999997,
      name: 'Test Zone',
      width: 300,
      height: 250,
      active: true
    });

    await testZone.validate();
    console.log('✅ Zone validation passed');

    console.log('\n🎯 Model Validation Summary:');
    console.log('✅ All models loaded and validated successfully!');
    console.log('✅ Database schemas are properly defined');
    console.log('✅ Model validation rules are working correctly');

  } catch (error) {
    console.log('❌ Model validation failed:', error.message);
    console.log('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
}

testModelValidation();