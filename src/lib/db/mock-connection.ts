/**
 * Mock Database Connection
 * 
 * Provides a simple mock MongoDB connection for build/static generation environments
 * to prevent unnecessary connection attempts during build time.
 */
import { EventEmitter } from 'events';
import mongoose, { Connection, ClientSession, ConnectOptions, Model, Schema } from 'mongoose';
import { Logger } from './connection-manager';

// Helper to create a mock model that satisfies basic Mongoose Model interface
function createMockModel(name: string) {
  // Base mock model with common methods
  const mockModel: any = function() {
    return {
      save: async () => ({ _id: 'mock-id' }),
    };
  };
  
  // Add static methods
  mockModel.find = async () => [];
  mockModel.findOne = async () => null;
  mockModel.findById = async () => null;
  mockModel.create = async () => ({ _id: 'mock-id' });
  mockModel.updateOne = async () => ({ modifiedCount: 1 });
  mockModel.deleteOne = async () => ({ deletedCount: 1 });
  mockModel.countDocuments = async () => 0;
  mockModel.schema = { obj: {} };
  mockModel.modelName = name;
  mockModel.db = {};
  mockModel.base = {};
  
  // Add prototype methods (for document instances)
  mockModel.prototype.save = async () => ({ _id: 'mock-id' });
  
  return mockModel;
}

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
  
  // Initialize models object to prevent "possibly undefined" errors
  const models: Record<string, any> = {};
  
  // Set basic properties
  Object.assign(mockConnection, {
    readyState: 1, // Connected
    models, // Use the pre-initialized models object
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
    model: (name: string) => {
      // Cache model instances like real Mongoose
      if (!(name in models)) {
        models[name] = createMockModel(name);
      }
      return models[name];
    },
    collection: () => ({
      insertOne: async () => ({ insertedId: 'mock-id' }),
      findOne: async () => null,
      find: async () => ({ toArray: async () => [] }),
      updateOne: async () => ({ modifiedCount: 1 }),
      deleteOne: async () => ({ deletedCount: 1 })
    }),
    
    // Implement commonly used methods
    startSession: async () => ({
      endSession: async () => {},
      withTransaction: async (fn: any) => fn({}),
      abortTransaction: async () => {},
      commitTransaction: async () => {},
      startTransaction: async () => {},
    }) as unknown as ClientSession,
    
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
  const mockModels: Record<string, any> = {};
  
  return {
    connection: getMockConnection() as any,
    connect: async () => mongoose,
    disconnect: async () => {},
    model: function(name: string, schema?: Schema) {
      // Cache models like real Mongoose
      if (!(name in mockModels)) {
        mockModels[name] = createMockModel(name);
      }
      return mockModels[name];
    } as any
  };
}
