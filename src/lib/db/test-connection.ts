/**
 * MongoDB Connection Test
 * 
 * Tests connection to MongoDB server and provides detailed diagnostics.
 */
import { loadEnvVars, ensureEnvVars } from './env-debug';
import { connectToDatabase, disconnectFromDatabase } from './mongodb';

// Load environment variables before testing
loadEnvVars();
ensureEnvVars();

async function testConnection() {
  console.log('Testing MongoDB connection...');
  
  try {
    const connection = await connectToDatabase();
    console.log('Connection successful!');
    
    // Get server info
    try {
      const adminDb = connection.db.admin();
      const serverInfo = await adminDb.serverStatus();
      
      console.log('\nServer information:');
      console.log(`- MongoDB version: ${serverInfo.version}`);
      console.log(`- Uptime: ${(serverInfo.uptime / 60 / 60).toFixed(2)} hours`);
      console.log(`- Connections: ${serverInfo.connections.current} (current) / ${serverInfo.connections.available} (available)`);
      
      // List databases
      const dbInfo = await adminDb.listDatabases();
      console.log('\nDatabases:');
      dbInfo.databases.forEach((db: any) => {
        console.log(`- ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
      });
      
      // Check if our database exists
      const dbName = process.env.MONGODB_DATABASE || 'subscriptions';
      const dbExists = dbInfo.databases.some((db: any) => db.name === dbName);
      if (!dbExists) {
        console.log(`\nNote: The '${dbName}' database doesn't exist yet. It will be created when data is first inserted.`);
      } else {
        // List collections in our database
        const db = connection.db;
        const collections = await db.listCollections().toArray();
        
        console.log(`\nCollections in '${dbName}' database:`);
        if (collections.length === 0) {
          console.log('- No collections found');
        } else {
          collections.forEach((collection: any) => {
            console.log(`- ${collection.name}`);
          });
        }
      }
    } catch (error) {
      console.warn('Could not retrieve detailed server information:', error);
    }
    
    await disconnectFromDatabase();
    console.log('\nConnection test completed successfully!');
  } catch (error) {
    console.error('Connection failed:', error);
  }
}

testConnection();
