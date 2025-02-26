import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getConnection, disconnectAll, createLogger } from '@/lib/db';
import bcrypt from 'bcryptjs';

// Simple user schema for testing
const TestUserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  hashedPassword: { type: String, required: true },
  testField: { type: String, default: 'This is a test user' }
}, { timestamps: true });

export async function GET(request: Request) {
  const url = new URL(request.url);
  const dbName = url.searchParams.get('db') || 'subscriptions';
  const testMode = url.searchParams.get('test') === 'true';
  const logger = createLogger('TestUserCreation');
  
  try {
    // Establish direct connection using our new connection manager
    logger.info(`Creating direct connection to database '${dbName}'`);
    
    const connection = await getConnection({
      direct: true,
      dbName,
      serverSelectionTimeoutMS: 5000,
      timeoutMS: 10000,
      logger,
    });
    
    // Verify db is available
    if (!connection.db) {
      throw new Error('Database connection not established');
    }
    
    logger.info('Database connection established successfully!');
    
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
        logger.info(`Creating test user with email: ${email}`);
        testUserResult = await TestUser.create({
          email,
          name: 'Test User',
          hashedPassword
        });
        
        logger.info('Created test user with ID:', testUserResult._id);
      } catch (createError) {
        logger.error('Error creating test user:', 
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
      ) : null
    });
  } catch (error) {
    logger.error('Test endpoint error:', {
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
    try {
      await disconnectAll();
      logger.info('Database connection closed after test');
    } catch (error) {
      logger.error('Error closing database connection:', error);
    }
  }
}