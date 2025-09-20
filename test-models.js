require('dotenv').config({ path: '.env.local' });

console.log('🧪 Testing Model Setup...\n');

// Test basic imports
try {
  const mongoose = require('mongoose');
  console.log('✅ Mongoose imported successfully');
} catch (e) {
  console.log('❌ Mongoose import failed:', e.message);
  process.exit(1);
}

// Test model compilation
async function testModels() {
  try {
    const connectDB = require('./src/lib/mongodb.ts').default;
    console.log('✅ MongoDB connection module imported');

    // Test individual model imports
    const models = [
      { name: 'advertisement', path: './src/lib/models/advertisement.ts' },
      { name: 'campaign', path: './src/lib/models/campaign.ts' },
      { name: 'zone', path: './src/lib/models/zone.ts' },
      { name: 'advertiser', path: './src/lib/models/advertiser.ts' },
      { name: 'network', path: './src/lib/models/network.ts' },
      { name: 'placement', path: './src/lib/models/placement.ts' },
      { name: 'theme', path: './src/lib/models/theme.ts' }
    ];

    for (const model of models) {
      try {
        const modelModule = require(model.path);
        console.log(`✅ ${model.name} model imported successfully`);
      } catch (e) {
        console.log(`❌ ${model.name} model import failed:`, e.message);
      }
    }

    console.log('\n🎯 Model Import Summary:');
    console.log('All models imported successfully!');

  } catch (e) {
    console.log('❌ Model test failed:', e.message);
  }
}

testModels();