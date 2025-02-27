/**
 * Simplified MongoDB Connection Manager
 * 
 * This module provides a reliable, persistent connection to MongoDB
 * using a singleton pattern to prevent premature disconnections.
 */

import mongoose from 'mongoose';
import { normalizeMongoUri } from './check-env';

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
  
  // Get MongoDB URI from environment
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/subscriptions';
  
  // Normalize the URI to ensure correct database name
  const normalizedUri = normalizeMongoUri(uri);
  
  // Start a new connection
  connectionPromise = mongoose.connect(normalizedUri)
    .then(() => {
      connection = mongoose.connection;
      
      // Log database name for debugging
      console.log(`[DB] Connected to database: ${connection.db.databaseName}`);
      
      // Listen for disconnect events
      connection.on('disconnected', () => {
        console.log('[DB] MongoDB disconnected');
        connection = null;
      });
      
      connection.on('error', (err) => {
        console.error('[DB] MongoDB connection error:', err);
        connection = null;
      });
      
      return connection;
    })
    .catch((err) => {
      console.error('[DB] MongoDB connection error:', err);
      connectionPromise = null;
      throw err;
    });
  
  return connectionPromise;
}

/**
 * Run an operation with a MongoDB connection
 * 
 * @param operation Function that performs database operations
 * @returns Result of the operation
 */
export async function withConnection<T>(
  operation: () => Promise<T>
): Promise<T> {
  // Get a connection first
  await getConnection();
  
  // Now run the operation
  return await operation();
}

/**
 * Safe serialize function to prevent circular references in Mongoose documents
 * 
 * @param obj Object to serialize
 * @returns Safely serialized object
 */
export function safeSerialize(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  // Handle Mongoose document - convert to POJO
  if (obj.toObject && typeof obj.toObject === 'function') {
    return safeSerialize(obj.toObject());
  }
  
  // Handle MongoDB ObjectId
  if (obj instanceof mongoose.Types.ObjectId) {
    return obj.toString();
  }
  
  // Handle Date objects
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => safeSerialize(item));
  }
  
  // Handle objects
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      // Skip Mongoose document methods and private fields
      if (key.startsWith('$') || (key.startsWith('_') && key !== '_id')) {
        continue;
      }
      try {
        result[key] = safeSerialize(obj[key]);
      } catch {
        // If serialization fails, use a placeholder
        result[key] = '[Unserializable]';
      }
    }
    return result;
  }
  
  // Return primitives as is
  return obj;
}
