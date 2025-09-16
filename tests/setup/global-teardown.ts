import mongoose from 'mongoose';

export default async function globalTeardown() {
  try {
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
      await mongoose.connection.close(false);
    }
  } catch {}
}



