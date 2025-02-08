import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Log current working directory
console.log('Current working directory:', process.cwd());

// Load environment variables
const result = dotenv.config({ path: resolve(process.cwd(), '.env.local') });

// Log the result of loading .env.local
console.log('Dotenv config result:', result);

// Log all environment variables (be careful not to log this in production!)
console.log('Environment variables:', {
  MONGODB_URI: process.env.MONGODB_URI,
  NODE_ENV: process.env.NODE_ENV,
  // Log the first few characters of sensitive variables
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET?.slice(0, 5),
});

import clientPromise from '.';

async function test() {
  try {
    const mongoose = await clientPromise;
    console.log('✅ MongoDB connected successfully!');
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  } catch (error) {
    console.error('❌ MongoDB connection test failed:', error);
    process.exit(1);
  }
}

test();
