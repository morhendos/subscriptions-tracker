// First, load environment variables
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Log current working directory
console.log('Current working directory:', process.cwd());

// Load environment variables BEFORE any other imports
const result = dotenv.config({ path: resolve(process.cwd(), '.env.local') });

// Log the result of loading .env.local
console.log('Dotenv config result:', result);

// Log all environment variables (be careful not to log this in production!)
console.log('Environment variables after loading:', {
  MONGODB_URI: process.env.MONGODB_URI,
  NODE_ENV: process.env.NODE_ENV,
});

// Only import MongoDB client after environment variables are loaded
import clientPromise from '.';

async function test() {
  try {
    console.log('Attempting to connect to MongoDB...');
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
