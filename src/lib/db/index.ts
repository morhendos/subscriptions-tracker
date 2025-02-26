/**
 * MongoDB Database Module
 * 
 * Provides simplified access to MongoDB connections and utilities.
 * This is the main entry point for database operations in the application.
 */

import mongoose from 'mongoose';
import MongoConnectionManager, { ConnectionOptions, Logger } from './connection-manager';
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
  const manager = MongoConnectionManager.getInstance(options);
  return manager.getConnection(options);
}

/**
 * Get a direct (non-pooled) MongoDB connection
 * 
 * @param options - Connection options
 * @returns A connection manager with a direct connection
 */
export async function getDirectConnection(options?: ConnectionOptions): Promise<{
  connection: mongoose.Connection;
  cleanup: () => Promise<void>;
}> {
  const manager = MongoConnectionManager.getInstance();
  
  try {
    const connection = await manager.getConnection({
      ...options,
      direct: true,
    });
    
    return {
      connection,
      cleanup: async () => {
        await manager.cleanup();
      },
    };
  } catch (error) {
    // Ensure proper cleanup even if connection fails
    await manager.cleanup();
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
  await MongoConnectionManager.disconnectAll();
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
  const manager = MongoConnectionManager.getInstance();
  const startTime = Date.now();
  
  try {
    // Get health check result from the connection manager
    const healthCheck = await manager.checkHealth();
    
    if (healthCheck.status === 'healthy') {
      return {
        status: 'healthy',
        latency: healthCheck.latency,
        timestamp: new Date().toISOString(),
        metrics: healthCheck.details,
        message: 'Database is responding normally'
      };
    } else {
      return {
        status: 'unhealthy',
        latency: healthCheck.latency,
        timestamp: new Date().toISOString(),
        message: `Database health check failed: ${healthCheck.details?.error || 'No healthy connection'}`
      };
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

// Create a custom logger for the connection manager
export function createLogger(prefix: string): Logger {
  return {
    debug: (message: string, ...args: any[]) => console.debug(`[${prefix}] ${message}`, ...args),
    info: (message: string, ...args: any[]) => console.info(`[${prefix}] ${message}`, ...args),
    warn: (message: string, ...args: any[]) => console.warn(`[${prefix}] ${message}`, ...args),
    error: (message: string, ...args: any[]) => console.error(`[${prefix}] ${message}`, ...args),
  };
}

// Export classes and functions
export {
  MongoConnectionManager,
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
  Logger,
};
