/**
 * MongoDB Connection Fix
 * 
 * This is a simplified version of the database connection utilities
 * that fixes the premature disconnection issues in the "Phase 2" code.
 */

import mongoose from 'mongoose';

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
}

/**
 * Close all connections
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
