/**
 * Authentication-specific Database Connection Manager
 * 
 * This module provides a specialized connection manager for authentication operations
 * to ensure reliable and persistent connections for login/registration flows.
 */

import mongoose from 'mongoose';
import { loadEnvVars } from './env-debug';
import { withErrorHandling } from './unified-error-handler';

// Define connection options type
export interface AuthConnectionOptions {
  timeoutMS?: number;
  serverSelectionTimeoutMS?: number;
  context?: string;
}

// Ensure environment variables are loaded
loadEnvVars();

// Global connection state
let authConnection: mongoose.Connection | null = null;
let connectionPromise: Promise<mongoose.Connection> | null = null;

/**
 * Normalize a MongoDB URI
 * 
 * This function ensures the URI has the correct database name.
 * It specifically addresses the issue where connections might be using
 * the 'test' database instead of 'subscriptions' in production.
 */
export function normalizeMongoUri(uri: string): string {
  // If the URI already includes 'subscriptions', don't modify it
  if (uri.includes('/subscriptions')) {
    return uri;
  }
  
  // Check if URI has a database segment
  const uriParts = uri.split('/');
  
  // If the URI has a database name specified (after the last slash)
  if (uriParts.length > 3) {
    // Get the base URI without the database name
    const baseUri = uriParts.slice(0, -1).join('/');
    // Ensure we use the 'subscriptions' database
    return `${baseUri}/subscriptions`;
  }
  
  // If no database is specified, append 'subscriptions'
  return `${uri}/subscriptions`;
}

/**
 * Get a MongoDB connection specifically for authentication operations
 */
export async function getAuthConnection(options?: AuthConnectionOptions): Promise<mongoose.Connection> {
  // If we already have a valid connection, return it
  if (authConnection && authConnection.readyState === 1) {
    return authConnection;
  }
  
  // If a connection attempt is in progress, wait for it
  if (connectionPromise) {
    return connectionPromise;
  }
  
  // Get and normalize MongoDB URI
  const originalUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/subscriptions';
  const normalizedUri = normalizeMongoUri(originalUri);
  
  // Log the database being used (without exposing full URI for security)
  console.log(`[AUTH DB] Using database: ${normalizedUri.split('/').pop()?.split('?')[0] || 'unknown'}`);
  
  // Configure connection options with improved settings for authentication
  const connectOptions: mongoose.ConnectOptions = {
    serverSelectionTimeoutMS: options?.serverSelectionTimeoutMS || 15000, // Wait 15 seconds for server selection
    connectTimeoutMS: options?.timeoutMS || 30000, // Wait 30 seconds for initial connection
    socketTimeoutMS: 45000, // Wait 45 seconds for socket operations
    maxPoolSize: 10, // Reduce pool size for auth operations
    minPoolSize: 1, // Always keep at least one connection open
    heartbeatFrequencyMS: 30000, // Check connection health every 30 seconds
    // Different default SSL setting based on environment
    ssl: process.env.MONGODB_SSL === 'true' || 
         (process.env.NODE_ENV === 'production' && process.env.MONGODB_SSL !== 'false')
  };
  
  // Start a new connection with detailed logging
  console.log('[AUTH DB] Establishing MongoDB connection for authentication...');
  
  connectionPromise = mongoose.connect(normalizedUri, connectOptions)
    .then(() => {
      authConnection = mongoose.connection;
      console.log('[AUTH DB] MongoDB connection established successfully.');
      // Use optional chaining to prevent TypeScript error
      console.log(`[AUTH DB] Connected to database: ${authConnection?.db?.databaseName || 'unknown'}`);
      
      // Listen for disconnect events
      authConnection.on('disconnected', () => {
        console.log('[AUTH DB] MongoDB disconnected, will reconnect on next auth operation');
        authConnection = null;
      });
      
      authConnection.on('error', (err) => {
        console.error('[AUTH DB] MongoDB connection error:', err);
        authConnection = null;
      });
      
      return authConnection;
    })
    .catch((err) => {
      console.error('[AUTH DB] MongoDB connection error:', err);
      connectionPromise = null;
      throw err;
    });
  
  return connectionPromise;
}

/**
 * Run an authentication operation with a dedicated MongoDB connection
 * 
 * @param operation Function that performs database operations
 * @param options Connection options or context string
 * @returns Result of the operation
 */
export async function withAuthConnection<T>(
  operation: () => Promise<T>,
  options?: AuthConnectionOptions | string
): Promise<T> {
  // Convert string context to options object if needed
  let connectionOptions: AuthConnectionOptions = {};
  
  if (typeof options === 'string') {
    connectionOptions = { context: options };
  } else if (options) {
    connectionOptions = options;
  }
  
  const context = connectionOptions.context || 'auth-operation';
  
  // Get an auth-specific connection with error handling
  await withErrorHandling(
    () => getAuthConnection(connectionOptions),
    context
  );
  
  // Now run the operation with error handling
  return withErrorHandling(
    operation,
    context
  );
}
