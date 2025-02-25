import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function GET() {
  try {
    console.log('Testing MongoDB connection...');
    console.log('Mongoose version:', mongoose.version);
    console.log('Current connection state:', mongoose.connection.readyState);
    console.log('Environment check:', {
      hasMongoDBURI: !!process.env.MONGODB_URI,
      uriLength: process.env.MONGODB_URI?.length,
      // Show URI format without exposing credentials
      uriFormat: process.env.MONGODB_URI 
        ? process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//[username]:[hidden]@')
        : 'undefined'
    });
    
    // Connect with a timeout to avoid hanging
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      connectTimeoutMS: 10000, // 10 second timeout
    });
    
    console.log('Connection successful!');
    
    // Basic database operation test
    const dbName = mongoose.connection.db.databaseName;
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    // Get server information
    const serverInfo = await mongoose.connection.db.admin().serverInfo();
    
    // Clean disconnect
    await mongoose.disconnect();
    
    return NextResponse.json({
      success: true,
      message: 'MongoDB connection successful',
      database: dbName,
      collections: collections.map(c => c.name),
      serverInfo: {
        version: serverInfo.version,
        gitVersion: serverInfo.gitVersion
      }
    });
  } catch (error) {
    console.error('Connection error details:', {
      name: error instanceof Error ? error.name : 'Unknown error',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 3).join('\n') : undefined
    });
    
    return NextResponse.json({
      success: false,
      error: {
        name: error instanceof Error ? error.name : 'Unknown error',
        message: error instanceof Error ? error.message : String(error),
        code: error instanceof Error && 'code' in error ? (error as any).code : undefined,
        codeName: error instanceof Error && 'codeName' in error ? (error as any).codeName : undefined
      }
    }, { status: 500 });
  }
}