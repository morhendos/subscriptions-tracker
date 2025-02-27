import { NextResponse } from 'next/server';
import { getConnection, disconnectAll, createLogger, shouldSkipDatabaseConnection } from '@/lib/db';

export async function GET() {
  const logger = createLogger('TestDB-Alt');
  
  // Return mock response during build
  if (shouldSkipDatabaseConnection()) {
    logger.info('[Build] Providing mock response for database test during build');
    
    return NextResponse.json({
      success: true,
      message: 'Mock direct MongoDB connection (build environment)',
      serverInfo: {
        version: '0.0.0-mock',
        gitVersion: 'mock-build'
      },
      databases: ['admin', 'config', 'local', 'mock_subscriptions']
    });
  }
  
  try {
    logger.info('Testing direct MongoDB connection...');
    
    // Connection using our new connection manager with direct connection option
    const connection = await getConnection({
      serverSelectionTimeoutMS: 5000,
      timeoutMS: 10000,
      direct: true, // Create a direct connection
      logger,
    });
    
    logger.info('Connection successful!');
    
    // Verify db is available
    if (!connection.db) {
      throw new Error('Database connection not established');
    }
    
    // Get database info
    const adminDb = connection.db.admin();
    const serverInfo = await adminDb.serverInfo();
    const dbList = await adminDb.listDatabases();
    
    // Close the connection
    await disconnectAll();
    
    return NextResponse.json({
      success: true,
      message: 'Direct MongoDB connection successful',
      serverInfo: {
        version: serverInfo.version,
        gitVersion: serverInfo.gitVersion
      },
      databases: dbList.databases.map((db: any) => db.name)
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
  } finally {
    // Ensure connection is closed
    await disconnectAll();
    logger.info('Connection cleanup complete');
  }
}