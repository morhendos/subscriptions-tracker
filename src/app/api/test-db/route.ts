import { NextResponse } from 'next/server';
import { getConnection, disconnectAll, MongoConnectionManager, createLogger, shouldSkipDatabaseConnection } from '@/lib/db';

export async function GET() {
  const logger = createLogger('TestDB');
  
  // Return mock response during build
  if (shouldSkipDatabaseConnection()) {
    logger.info('[Build] Providing mock response for database test during build');
    
    return NextResponse.json({
      success: true,
      message: 'Mock database connection (build environment)',
      database: 'mock_subscriptions',
      collections: ['users', 'subscriptions'],
      serverInfo: {
        version: '0.0.0-mock',
        gitVersion: 'mock-build'
      },
      health: {
        status: 'healthy',
        latency: 0,
        buildEnvironment: true
      }
    });
  }
  
  try {
    logger.info('Testing MongoDB connection...');
    
    // Get connection with the new connection manager
    const connection = await getConnection({
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      timeoutMS: 10000, // 10 second timeout
      logger,
    });
    
    logger.info('Connection successful!');
    
    // Check if db is available
    if (!connection.db) {
      throw new Error('Database connection not established');
    }
    
    // Get connection health
    const manager = MongoConnectionManager.getInstance();
    const health = await manager.checkHealth(connection);
    
    // Basic database operation test
    const dbName = connection.db.databaseName;
    const collections = await connection.db.listCollections().toArray();
    
    // Get server information
    const serverInfo = await connection.db.admin().serverInfo();
    
    // Clean disconnect
    await disconnectAll();
    
    return NextResponse.json({
      success: true,
      message: 'MongoDB connection successful',
      database: dbName,
      collections: collections.map(c => c.name),
      serverInfo: {
        version: serverInfo.version,
        gitVersion: serverInfo.gitVersion
      },
      health: health
    });
  } catch (error) {
    logger.error('Connection error details:', {
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