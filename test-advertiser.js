const { MongoClient } = require('mongodb');

async function testAdvertiser() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('broadstreet-campaigns');
  
  // Find the problematic advertiser
  const advertiser = await db.collection('advertisers').findOne({ 
    synced_with_api: false,
    created_locally: true 
  });
  
  console.log('Found advertiser:', JSON.stringify(advertiser, null, 2));
  
  await client.close();
}

testAdvertiser().catch(console.error);
