/**
 * Test Database Connection with Info
 * 
 * This script tests the MongoDB connection and provides detailed information
 * about the database being used, which helps diagnose issues with
 * connecting to the wrong database in production.
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Function to normalize MongoDB URI to ensure correct database
function normalizeMongoUri(uri) {
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

async function testConnection() {
  console.log('\n----- MongoDB Connection Test With Database Info -----');
  
  try {
    // Get MongoDB URI from environment variables or use default
    const originalUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/subscriptions';
    
    // Remove sensitive parts for logging
    const uriForLogging = originalUri.replace(/:\/\/[^:]+:[^@]+@/, '://****:****@');
    console.log(`Original URI: ${uriForLogging}`);
    
    // Normalize the URI to ensure correct database
    const normalizedUri = normalizeMongoUri(originalUri);
    
    // Remove sensitive parts for logging
    const normalizedUriForLogging = normalizedUri.replace(/:\/\/[^:]+:[^@]+@/, '://****:****@');
    console.log(`Normalized URI: ${normalizedUriForLogging}`);
    
    // Get just the database name for clarity
    const dbName = normalizedUri.split('/').pop()?.split('?')[0] || 'unknown';
    console.log(`Target database name: ${dbName}`);
    
    // Connect to MongoDB
    console.log('\nConnecting to MongoDB...');
    await mongoose.connect(normalizedUri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 15000
    });
    
    // Get connection info
    console.log('Connection successful!');
    const connection = mongoose.connection;
    console.log(`Connected to database: ${connection.db.databaseName}`);
    
    // Check if connected to the right database
    if (connection.db.databaseName !== 'subscriptions') {
      console.log('\n⚠️ WARNING: Connected to wrong database!');
      console.log(`Expected to connect to 'subscriptions' but connected to '${connection.db.databaseName}' instead.`);
      console.log('This may cause authentication issues if users are stored in the subscriptions database.\n');
    } else {
      console.log('\n✅ Connected to the correct database: subscriptions\n');
    }
    
    // Check collections
    const collections = await connection.db.listCollections().toArray();
    console.log('\nAvailable collections:');
    collections.forEach(collection => {
      console.log(`  - ${collection.name}`);
    });
    
    // Check for users collection specifically
    const hasUsers = collections.some(c => c.name === 'users');
    if (hasUsers) {
      console.log('\n✅ Found users collection\n');
      
      // Count users if the collection exists
      const userCount = await connection.db.collection('users').countDocuments();
      console.log(`There are ${userCount} users in the database.`);
      
      if (userCount === 0) {
        console.log('\n⚠️ WARNING: No users found in the database!');
        console.log('You may need to create a user before being able to log in.\n');
      }
    } else {
      console.log('\n⚠️ WARNING: Users collection not found!');
      console.log('This database may not be set up for authentication.\n');
    }
    
    // Disconnect
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    console.log('\n----- Test Complete -----\n');
    
  } catch (error) {
    console.error('Connection test failed:', error);
  } finally {
    // Ensure process exits
    process.exit(0);
  }
}

// Run the test
testConnection();
