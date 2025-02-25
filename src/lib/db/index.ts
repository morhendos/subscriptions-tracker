/**
 * MongoDB Database Module
 * 
 * Provides simplified access to MongoDB connections and utilities.
 * This is the main entry point for database operations in the application.
 */

import mongoose from 'mongoose';
import { MongoConnectionFactory, ConnectionOptions } from './connection-manager';
import { handleMongoError, logMongoError, MongoDBError, MongoDBErrorCode } from './error-handler';
import { dbConfig } from '@/config/database';
import { normalizeMongoURI, getSanitizedURI } from '@/utils/mongodb-utils';

/**
 * Get a MongoDB connection
 * 
 * @param options - Connection options
 * @returns A promise resolving to a mongoose connection
 */
export async function getConnection(options?: ConnectionOptions): Promise<mongoose.Connection> {
  const factory = new MongoConnectionFactory(options);
  return factory.getConnection();
}

/**
 * Get a direct (non-pooled) MongoDB connection
 * 
 * @param options - Connection options
 * @returns A MongoConnectionFactory with a direct connection
 */
export async function getDirectConnection(options?: ConnectionOptions): Promise<{
  connection: mongoose.Connection;
  cleanup: () => Promise<void>;
}> {
  const factory = new MongoConnectionFactory({
    ...options,
    direct: true,
  });
  
  try {
    const connection = await factory.getConnection();
    return {
      connection,
      cleanup: async () => {
        await factory.cleanup();
      },
    };
  } catch (error) {
    // Ensure proper cleanup even if connection fails
    await factory.cleanup();
    throw handleMongoError(error, 'Failed to create direct connection');
  }
}

/**
 * Run a database operation with a direct connection and automatic cleanup
 * 
 * @param operation - Function that accepts a mongoose connection and returns a result
 * @param options - Connection options
 * @returns The result of the operation
 */
export async function withConnection<T>(
  operation: (connection: mongoose.Connection) => Promise<T>,
  options?: ConnectionOptions
): Promise<T> {
  const { connection, cleanup } = await getDirectConnection(options);
  
  try {
    return await operation(connection);
  } finally {
    await cleanup();
  }
}

/**
 * Disconnect all database connections
 * Useful for application shutdown or tests
 */
export async function disconnectAll(): Promise<void> {
  await MongoConnectionFactory.disconnectAll();
}

/**
 * Get health information about the database
 * 
 * @returns Database health information
 */
export async function getDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  latency: number;
  metrics?: Record<string, any>;
  message?: string;
  timestamp: string;
}> {
  const startTime = Date.now();
  
  try {
    const { connection, cleanup } = await getDirectConnection({
      timeoutMS: 3000,
      serverSelectionTimeoutMS: 2000,
    });
    
    try {
      if (!connection.db) {
        throw new Error('Database connection not established');
      }

      const adminDb = connection.db.admin();
      
      // Execute checks in parallel
      const [ping, serverStatus] = await Promise.all([
        adminDb.ping(),
        adminDb.serverStatus().catch(() => null),
      ]);

      if (!ping.ok) {
        throw new Error('Database ping failed');
      }

      const latency = Date.now() - startTime;
      
      // Create metrics object
      const metrics: Record<string, any> = {};
      
      if (serverStatus) {
        metrics.connections = {
          current: serverStatus.connections.current,
          available: serverStatus.connections.available,
          utilizationPercentage: (serverStatus.connections.current / serverStatus.connections.available) * 100
        };
        
        metrics.opcounters = serverStatus.opcounters;
      }

      return {
        status: 'healthy',
        latency,
        timestamp: new Date().toISOString(),
        metrics,
        message: 'Database is responding normally'
      };
    } finally {
      await cleanup();
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logMongoError(error, 'Health check');
    
    return {
      status: 'unhealthy',
      latency: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      message: `Database health check failed: ${errorMessage}`
    };
  }
}

// Export classes and functions
export {
  MongoConnectionFactory,
  handleMongoError,
  logMongoError,
  normalizeMongoURI,
  getSanitizedURI,
  dbConfig,
};

// Export types (using 'export type' for isolated modules)
export type {
  ConnectionOptions,
  MongoDBError,
  MongoDBErrorCode,
};