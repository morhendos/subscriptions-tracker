/**
 * MongoDB Connection Fix
 * 
 * This module fixes the critical issue in the Phase 2 connection manager where connections
 * are being closed prematurely, causing "MongoNotConnectedError: Client must be connected 
 * before running operations" errors.
 * 
 * WHAT WENT WRONG:
 * 
 * The Phase 2 connection manager implementation had these fundamental issues:
 * 
 * 1. The withConnection() function was creating and then immediately cleaning up connections,
 *    not giving operations enough time to complete
 * 
 * 2. The cleanup() function was being called in the promise chain before database operations
 *    were fully completed
 * 
 * 3. The direct connection mode created a new mongoose instance but then didn't wait for
 *    operations to complete before disconnecting
 * 
 * 4. There was no proper connection pooling - each request created and destroyed
 *    a new connection
 * 
 * THE SOLUTION:
 * 
 * This simplified implementation:
 * 
 * 1. Creates a SINGLETON connection that's reused across requests
 * 
 * 2. Only disconnects when explicitly told to (not automatically)
 * 
 * 3. Maintains an active connection throughout the application lifecycle
 * 
 * 4. Handles reconnection automatically and transparently
 */

import mongoose from 'mongoose';

// Global connection state
let connection: mongoose.Connection | null = null;
let connectionPromise: Promise<mongoose.Connection> | null = null;

/**
 * Get a MongoDB connection, reusing an existing one if available
 */
export async function getConnection(): Promise<mongoose.Connection> {
  // If we already have a valid connection, return it
  if (connection && connection.readyState === 1) {
    return connection;
  }
  
  // If a connection attempt is in progress, wait for it
  if (connectionPromise) {
    return connectionPromise;
  }
  
  // Start a new connection
  console.log('[DB FIX] Creating new MongoDB connection');
  
  connectionPromise = mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/subscriptions')
    .then(() => {
      console.log('[DB FIX] MongoDB connected successfully');
      connection = mongoose.connection;
      
      // Listen for disconnect events
      connection.on('disconnected', () => {
        console.log('[DB FIX] MongoDB disconnected');
        connection = null;
      });
      
      connection.on('error', (err) => {
        console.error('[DB FIX] MongoDB connection error:', err);
        connection = null;
      });
      
      return connection;
    })
    .catch((err) => {
      console.error('[DB FIX] MongoDB connection failed:', err);
      connectionPromise = null;
      throw err;
    });
  
  return connectionPromise;
}

/**
 * Run an operation with a MongoDB connection
 * 
 * THE KEY DIFFERENCE:
 * Unlike the original Phase 2 implementation that would immediately
 * close connections after use, this implementation keeps the connection
 * open for future operations, dramatically improving reliability.
 */
export async function withConnection<T>(
  operation: () => Promise<T>
): Promise<T> {
  // Get a connection first
  await getConnection();
  
  // Now run the operation
  try {
    return await operation();
  } catch (error) {
    console.error('[DB FIX] Operation failed:', error);
    throw error;
  }
  
  // IMPORTANT: We do NOT close the connection here!
  // This is intentional and fixes the premature disconnection issue.
}

/**
 * Close all connections - call this only when shutting down the application
 */
export async function closeConnections(): Promise<void> {
  if (connection) {
    try {
      await mongoose.disconnect();
      console.log('[DB FIX] All connections closed');
      connection = null;
      connectionPromise = null;
    } catch (error) {
      console.error('[DB FIX] Error closing connections:', error);
    }
  }
}

/**
 * Migration Guide:
 * 
 * To fix database connection issues, replace any instance of:
 * 
 * import { withConnection } from '@/lib/db';
 * 
 * With:
 * 
 * import { withConnection } from '@/lib/db/connection-fix';
 * 
 * This will ensure database operations have time to complete before the
 * connection is terminated. The fixed version maintains a persistent
 * connection rather than creating and destroying connections for each operation.
 */
