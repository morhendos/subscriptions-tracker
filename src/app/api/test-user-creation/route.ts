import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getAtlasConfig } from '@/lib/db/atlas-config';
import bcrypt from 'bcryptjs';

// Simple user schema for testing
const TestUserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  hashedPassword: { type: String, required: true },
  testField: { type: String, default: 'This is a test user' }
}, { timestamps: true });

// Direct connection to MongoDB without using cached connection
async function createDirectConnection(dbName: string = 'subscriptions'): Promise<{
  connection: mongoose.Connection;
  uri: string;
}> {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not defined');
  }

  // Get Atlas configuration
  const atlasConfig = getAtlasConfig(process.env.NODE_ENV);
  
  // Log the sanitized URI
  const sanitizedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//[username]:[hidden]@');
  console.log('Test endpoint connecting to MongoDB:', sanitizedUri);
  
  // Properly reconstruct the URI with database name
  let uriWithDb = constructProperUriWithDbName(uri, dbName);

  console.log('Modified URI with explicit database name:', 
    uriWithDb.replace(/\/\/([^:]+):([^@]+)@/, '//[username]:[hidden]@'));
  
  try {
    // Connect with a direct connection
    const mongooseInstance = await mongoose.connect(uriWithDb, {
      ...atlasConfig,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    
    console.log('Direct MongoDB connection established successfully!');
    return { 
      connection: mongooseInstance.connection,
      uri: uriWithDb 
    };
  } catch (error) {
    console.error('Direct MongoDB connection failed with error:', 
      error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// Helper function to properly construct a MongoDB URI with database name
function constructProperUriWithDbName(uri: string, dbName: string): string {
  try {
    // Parse the URI to properly handle different URI formats
    const url = new URL(uri);
    
    // Extract the current path (which might contain a database name)
    let path = url.pathname;
    
    // Check if the path is just a slash or empty, or contains an invalid database name
    if (path === '/' || path === '' || path.includes('_/')) {
      // Replace the path with just the database name
      url.pathname = `/${dbName}`;
    } else {
      // If the path already has a database name (but not the one we want)
      // We extract everything before any query parameters and replace the db name
      
      // Remove any query parameters from consideration
      const pathWithoutQuery = path.split('?')[0];
      
      // Check if the path already has our desired database name
      if (pathWithoutQuery === `/${dbName}`) {
        // Nothing to do, correct database name is already in the path
      } else {
        // Replace whatever database name is there with our desired one
        url.pathname = `/${dbName}`;
      }
    }
    
    // Ensure we have the necessary query parameters
    const searchParams = new URLSearchParams(url.search);
    if (!searchParams.has('retryWrites')) {
      searchParams.set('retryWrites', 'true');
    }
    if (!searchParams.has('w')) {
      searchParams.set('w', 'majority');
    }
    
    // Update the search parameters
    url.search = searchParams.toString();
    
    // Return the properly formatted URI
    return url.toString();
  } catch (error) {
    // If URL parsing fails, fall back to a more basic string manipulation
    console.warn('Failed to parse MongoDB URI as URL, falling back to string manipulation');
    
    // Remove any existing database name and query parameters
    let baseUri = uri;
    
    // Check for presence of query parameters
    const queryIndex = baseUri.indexOf('?');
    if (queryIndex > -1) {
      baseUri = baseUri.substring(0, queryIndex);
    }
    
    // Ensure URI ends with a single slash
    if (!baseUri.endsWith('/')) {
      baseUri = `${baseUri}/`;
    }
    
    // Append database name and query parameters
    return `${baseUri}${dbName}?retryWrites=true&w=majority`;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const dbName = url.searchParams.get('db') || 'subscriptions';
  const testMode = url.searchParams.get('test') === 'true';
  
  let connection: mongoose.Connection | null = null;
  
  try {
    // Establish direct connection
    const { connection: conn, uri } = await createDirectConnection(dbName);
    connection = conn;
    
    // Verify db is available
    if (!connection.db) {
      throw new Error('Database connection not established');
    }
    
    const serverInfo = await connection.db.admin().serverInfo();
    
    // Get available collections
    const collections = await connection.db.listCollections().toArray();
    
    // Create test user if requested
    let testUserResult = null;
    if (testMode) {
      // Register test model
      const TestUser = mongoose.models.TestUser || 
        mongoose.model('TestUser', TestUserSchema);
        
      // Try creating a test user
      const hashedPassword = await bcrypt.hash('testPassword123', 10);
      
      // Unique email based on timestamp
      const email = `test-${Date.now()}@example.com`;
      
      try {
        testUserResult = await TestUser.create({
          email,
          name: 'Test User',
          hashedPassword
        });
        
        console.log('Created test user with ID:', testUserResult._id);
      } catch (createError) {
        console.error('Error creating test user:', 
          createError instanceof Error ? createError.message : String(createError));
          
        testUserResult = {
          error: createError instanceof Error ? createError.message : String(createError)
        };
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'User creation test completed',
      database: connection.db.databaseName,
      serverInfo: {
        version: serverInfo.version,
        gitVersion: serverInfo.gitVersion
      },
      collections: collections.map(c => c.name),
      testUserCreated: testMode ? (testUserResult ? true : false) : null,
      testUserResult: testMode ? (
        testUserResult && testUserResult._id ? 
          { id: testUserResult._id.toString(), email: testUserResult.email } : 
          testUserResult
      ) : null,
      uriInfo: {
        includesDbName: uri.includes(`/${dbName}?`),
        uriPattern: uri.replace(/\/\/([^:]+):([^@]+)@/, '//[username]:[hidden]@')
                      .replace(/[^\/]+\.[^\/]+\.mongodb\.net/, '[cluster].mongodb.net')
      }
    });
  } catch (error) {
    console.error('Test endpoint error:', {
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
      }
    }, { status: 500 });
  } finally {
    // Always ensure we close the connection
    if (connection) {
      try {
        await mongoose.disconnect();
        console.log('Database connection closed after test');
      } catch (error) {
        console.error('Error closing database connection:', error);
      }
    }
  }
}