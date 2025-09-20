import mongoose from 'mongoose';
import { loadEnv } from './load-env.mjs';

async function main() {
  loadEnv();
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('[db:drop] MONGODB_URI not set. Define it in .env.local');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri, { bufferCommands: false });
    const db = mongoose.connection.db;
    await db.dropDatabase();
    await mongoose.disconnect();
    console.log('[db:drop] Dropped database');
    process.exit(0);
  } catch (err) {
    console.error('[db:drop] Error:', err?.message || err);
    try { await mongoose.disconnect(); } catch {}
    process.exit(1);
  }
}

main();

