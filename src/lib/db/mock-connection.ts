/**
 * Mock Database Connection
 * 
 * Provides a mock MongoDB connection for build/static generation environments
 * to prevent unnecessary connection attempts during build time.
 */
import { EventEmitter } from 'events';
import mongoose, { Connection } from 'mongoose';
import { Logger } from './connection-manager';

// Mock connection class to simulate a Mongoose connection
class MockConnection extends EventEmitter implements Partial<Connection> {
  // Implement minimal required properties to satisfy the Connection interface
  readyState = 1; // Always connected
  models = {};
  collections = {};
  config = {};
  id = 'mock-connection';
  name = 'mock';
  host = 'localhost';
  port = 27017;
  db: any = {
    // Mock basic database methods
    admin: () => ({
      ping: async () => ({ ok: 1 }),
      serverInfo: async () => ({ 
        version: '0.0.0-mock',
        gitVersion: 'mock'
      }),
      serverStatus: async () => ({ 
        connections: { 
          current: 0,
          available: 100
        },
        opcounters: {},
        mem: {}
      }),
      listDatabases: async () => ({
        databases: [
          { name: 'admin', sizeOnDisk: 0 },
          { name: 'local', sizeOnDisk: 0 },
          { name: 'mock_subscriptions', sizeOnDisk: 0 }
        ]
      }),
      command: async () => ({ ok: 1 })
    }),
    // Mock collection operations
    collection: () => ({
      insertOne: async () => ({ insertedId: 'mock-id' }),
      findOne: async () => null,
      find: async () => ({ toArray: async () => [] }),
      updateOne: async () => ({ modifiedCount: 1 }),
      deleteOne: async () => ({ deletedCount: 1 })
    }),
    // Mock collection listing
    listCollections: () => ({
      toArray: async () => []
    }),
    // Database name
    databaseName: 'mock_subscriptions'
  };

  // Add basic required methods
  constructor() {
    super();
    this.setMaxListeners(0);
  }

  // Mock close method
  async close(): Promise<void> {
    this.emit('close');
  }
}

// Create a mock mongoose instance
class MockMongoose {
  connection: MockConnection;
  
  constructor() {
    this.connection = new MockConnection();
  }
  
  // Mock connect method
  async connect(): Promise<typeof mongoose> {
    return mongoose;
  }
  
  // Mock disconnect method
  async disconnect(): Promise<void> {
    // Nothing to do
  }
  
  // Mock model creation
  model(name: string, schema: any): any {
    const MockModel = class {
      static modelName = name;
      static schema = schema;
      static findOne = async () => null;
      static find = async () => ({ exec: async () => [] });
      static create = async () => ({ _id: 'mock-id' });
      static countDocuments = async () => 0;
    };
    return MockModel;
  }
}

/**
 * Get a mock database connection
 * 
 * @param logger - Optional logger to use
 * @returns A mock connection object
 */
export function getMockConnection(logger?: Logger): MockConnection {
  if (logger) {
    logger.info('[MongoDB] Using mock connection for build environment');
  } else {
    console.info('[MongoDB] Using mock connection for build environment');
  }
  
  return new MockConnection();
}

/**
 * Get a mock mongoose instance
 * 
 * @returns A mock mongoose object
 */
export function getMockMongoose(): Partial<typeof mongoose> {
  return new MockMongoose() as any;
}
