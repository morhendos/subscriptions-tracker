/**
 * Mock Database Connection
 * 
 * Provides a simple mock MongoDB connection for build/static generation environments
 * to prevent unnecessary connection attempts during build time.
 */
import { EventEmitter } from 'events';
import mongoose, { Connection, ClientSession, ConnectOptions } from 'mongoose';
import { Logger } from './connection-manager';

/**
 * Get a mock database connection
 * 
 * @param logger - Optional logger to use
 * @returns A mock connection object
 */
export function getMockConnection(logger?: Logger): Connection {
  if (logger) {
    logger.info('[MongoDB] Using mock connection for build environment');
  } else {
    console.info('[MongoDB] Using mock connection for build environment');
  }
  
  // Create a simple mock connection object that satisfies the Connection interface
  // Using type assertion to avoid having to implement all methods
  const mockConnection: Partial<Connection> = new EventEmitter() as Partial<Connection>;
  
  // Set basic properties
  Object.assign(mockConnection, {
    readyState: 1, // Connected
    models: {},
    collections: {},
    id: 999,
    name: 'mock',
    host: 'localhost',
    port: 27017,
    user: '', 
    pass: '',
    states: mongoose.ConnectionStates,
    
    // Basic methods
    close: async () => Promise.resolve(),
    openUri: async () => mockConnection as Connection,
    
    // Collection and model methods
    model: () => ({}),
    collection: () => ({}),
    
    // Implement commonly used methods
    startSession: async () => ({}) as unknown as ClientSession,
    
    // Mock database object
    db: {
      admin: () => ({
        ping: async () => ({ ok: 1 }),
        serverStatus: async () => ({ connections: { current: 0, available: 100 } })
      }),
      databaseName: 'mock_subscriptions'
    },

    // Other methods will be handled through the Proxy if needed
  });
  
  // Use a Proxy to handle any other method or property requests that aren't explicitly defined
  return new Proxy(mockConnection as Connection, {
    get(target, prop) {
      // If the property exists on the target, return it
      if (prop in target) {
        return target[prop as keyof Connection];
      }
      
      // For any missing methods, return a function that resolves successfully
      if (typeof prop === 'string') {
        return typeof target[prop as keyof Connection] === 'function'
          ? () => Promise.resolve({})
          : {};
      }
      
      return undefined;
    }
  });
}

/**
 * Get a mock mongoose instance
 * 
 * @returns A mock mongoose object
 */
export function getMockMongoose(): Partial<typeof mongoose> {
  return {
    connection: getMockConnection() as any,
    connect: async () => mongoose,
    disconnect: async () => {},
    model: () => class {},
  };
}
