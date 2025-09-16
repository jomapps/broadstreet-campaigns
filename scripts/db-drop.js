/* eslint-disable no-console */
const mongoose = require('mongoose');
const { loadEnv } = require('./load-env');

async function main() {
  loadEnv();
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri, { bufferCommands: false });
    const db = mongoose.connection.db;
    await db.dropDatabase();
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    try { await mongoose.disconnect(); } catch {}
    process.exit(1);
  }
}

main();


