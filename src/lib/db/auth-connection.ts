/**
 * Authentication-specific Database Connection Manager
 * 
 * This module provides a specialized connection manager for authentication operations
 * to ensure reliable and persistent connections for login/registration flows.
 */

import mongoose from 'mongoose';
import { loadEnvVars } from './env-debug';

// Ensure environment variables are loaded
loadEnvVars();

// Global connection state
let authConnection: mongoose.Connection | null = null;
let connectionPromise: Promise<mongoose.Connection> | null = null;

/**
 * Get a MongoDB connection specifically for authentication operations
 */
export async function getAuthConnection(): Promise<mongoose.Connection> {
  // If we already have a valid connection, return it
  if (authConnection && authConnection.readyState === 1) {
    return authConnection;
  }
  
  // If a connection attempt is in progress, wait for it
  if (connectionPromise) {
    return connectionPromise;
  }
  
  // Normalize MongoDB URI
  let mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/subscriptions';
  
  // Add database name if missing
  if (!mongoUri.includes('/subscriptions')) {
    // Check if URI already has a database
    if (mongoUri.lastIndexOf('/') > 10) { // 10 is a heuristic to avoid confusing protocol slashes
      // Replace existing database with 'subscriptions'
      const baseUri = mongoUri.substring(0, mongoUri.lastIndexOf('/'));
      mongoUri = `${baseUri}/subscriptions`;
    } else {
      // Append 'subscriptions' database
      mongoUri = `${mongoUri}/subscriptions`;
    }
  }
  
  // Configure connection options with improved settings for authentication
  const options: mongoose.ConnectOptions = {
    serverSelectionTimeoutMS: 15000, // Wait 15 seconds for server selection
    connectTimeoutMS: 30000, // Wait 30 seconds for initial connection
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
  
  connectionPromise = mongoose.connect(mongoUri, options)
    .then(() => {
      authConnection = mongoose.connection;
      console.log('[AUTH DB] MongoDB connection established successfully.');
      
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
 * @returns Result of the operation
 */
export async function withAuthConnection<T>(
  operation: () => Promise<T>
): Promise<T> {
  // Get an auth-specific connection first
  await getAuthConnection();
  
  // Now run the operation
  try {
    return await operation();
  } catch (error) {
    console.error('[AUTH DB] Error during authentication operation:', error);
    throw error;
  }
}
