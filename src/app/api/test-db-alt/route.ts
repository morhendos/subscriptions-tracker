import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export async function GET() {
  let client = null;
  
  try {
    console.log('Testing direct MongoDB connection...');
    
    // Connection using direct MongoClient instead of Mongoose
    const uri = process.env.MONGODB_URI;
    console.log('URI format check:', 
      uri?.includes('mongodb+srv://') && 
      uri?.includes('@') && 
      uri?.includes('?')
    );
    
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }
    
    // Connect with a timeout
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    
    console.log('Attempting to connect...');
    await client.connect();
    console.log('Connection successful!');
    
    // Get database info
    const adminDb = client.db().admin();
    const serverInfo = await adminDb.serverInfo();
    const dbList = await adminDb.listDatabases();
    
    return NextResponse.json({
      success: true,
      message: 'Direct MongoDB connection successful',
      serverInfo: {
        version: serverInfo.version,
        gitVersion: serverInfo.gitVersion
      },
      databases: dbList.databases.map(db => db.name)
    });
  } catch (error) {
    console.error('Connection error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    });
    
    return NextResponse.json({
      success: false,
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        codeName: error.codeName
      }
    }, { status: 500 });
  } finally {
    // Always close the connection
    if (client) {
      await client.close();
      console.log('Connection closed');
    }
  }
}