/* eslint-disable no-console */
const mongoose = require('mongoose');
const { loadEnv } = require('./load-env');

async function main() {
  loadEnv();
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGODB_URI not set. Define it in .env.local');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri, { bufferCommands: false });
    const db = mongoose.connection.db;
    const dbName = mongoose.connection.name;
    console.log(`[db:drop] Dropping database: ${dbName}`);
    await db.dropDatabase();
    console.log('[db:drop] Success');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[db:drop] Error:', err.message || err);
    try { await mongoose.disconnect(); } catch {}
    process.exit(1);
  }
}

main();


