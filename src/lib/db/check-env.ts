/**
 * Environment Variable Checker for MongoDB
 * 
 * This utility checks and normalizes environment variables
 * related to MongoDB connections.
 */

import { loadEnvVars } from './env-debug';

// Function to normalize MongoDB URI to ensure correct database
export function normalizeMongoUri(uri: string): string {
  // If the URI already includes 'subscriptions', don't modify it
  if (uri.includes('/subscriptions')) {
    return uri;
  }
  
  // Check if URI has a database segment
  const uriParts = uri.split('/');
  
  // If the URI has a database name specified (after the last slash)
  if (uriParts.length > 3) {
    // Get the base URI without the database name
    const baseUri = uriParts.slice(0, -1).join('/');
    // Ensure we use the 'subscriptions' database
    return `${baseUri}/subscriptions`;
  }
  
  // If no database is specified, append 'subscriptions'
  return `${uri}/subscriptions`;
}

async function checkEnvironment() {
  console.log('\n📋 Checking MongoDB Environment Variables...\n');
  
  // Load environment variables first
  loadEnvVars();
  
  // Check MongoDB URI
  const mongoUri = process.env.MONGODB_URI || '';
  if (!mongoUri) {
    console.log('❌ MONGODB_URI is not set!');
    console.log('   It should be set in your .env.local file');
    console.log('   Example: MONGODB_URI=mongodb://localhost:27017/subscriptions');
  } else {
    // Mask sensitive parts of the URI for logging
    const maskedUri = mongoUri.replace(/:\/\/[^:]+:[^@]+@/, '://****:****@');
    console.log(`✅ MONGODB_URI is set: ${maskedUri}`);
    
    // Check if URI has the correct database
    const dbName = mongoUri.split('/').pop()?.split('?')[0];
    if (dbName !== 'subscriptions') {
      console.log(`⚠️ Warning: Database in URI is "${dbName}" but should be "subscriptions"`);
      console.log('   This might cause authentication issues if users are stored in the wrong database');
      
      // Normalize the URI
      const normalizedUri = normalizeMongoUri(mongoUri);
      const normalizedDbName = normalizedUri.split('/').pop()?.split('?')[0];
      console.log(`ℹ️ Normalized database name would be: ${normalizedDbName}`);
    } else {
      console.log('✅ Database name is correctly set to "subscriptions"');
    }
  }
  
  // Check NextAuth environment variables
  const nextAuthSecret = process.env.NEXTAUTH_SECRET;
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  
  console.log('\n📋 Checking NextAuth Environment Variables...\n');
  
  if (!nextAuthSecret) {
    console.log('❌ NEXTAUTH_SECRET is not set!');
    console.log('   It should be set in your .env.local file');
    console.log('   Generate a secure random string for this value');
  } else {
    console.log('✅ NEXTAUTH_SECRET is set');
  }
  
  if (!nextAuthUrl) {
    console.log('⚠️ NEXTAUTH_URL is not set!');
    console.log('   This is optional in development but required in production');
    console.log('   Example: NEXTAUTH_URL=https://your-production-domain.com');
  } else {
    console.log(`✅ NEXTAUTH_URL is set: ${nextAuthUrl}`);
  }
  
  console.log('\n📋 Environment Check Complete\n');
}

// Run the check if this file is executed directly
if (require.main === module) {
  checkEnvironment();
}

export default checkEnvironment;
