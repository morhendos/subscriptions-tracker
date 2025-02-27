/**
 * Mock Database Connection
 * 
 * Provides a mock MongoDB connection for build/static generation environments
 * to prevent unnecessary connection attempts during build time.
 */
import { EventEmitter } from 'events';
import mongoose, { 
  Connection, 
  ClientSession, 
  ConnectOptions, 
  ConnectionStates, 
  Schema,
  Model,
  CompileModelOptions,
  Document,
  Collection,
  CollectionOptions,
  IndexDefinition,
  IndexOptions,
  InferSchemaType
} from 'mongoose';
import { Logger } from './connection-manager';

// Mock connection class to simulate a Mongoose connection
class MockConnection extends EventEmitter implements Connection {
  // Implement required properties from Connection interface
  readyState: ConnectionStates = 1; // Always connected (1 = connected)
  models = {};
  collections = {};
  config: any = {};
  id = 999; // Mock connection ID as a number
  name = 'mock';
  host = 'localhost';
  port = 27017;
  user = ''; // Changed from undefined to empty string to match Connection interface
  pass = ''; // Changed from undefined to empty string to match Connection interface
  activeConnection = null;
  states = mongoose.ConnectionStates;
  client: any = null;

  // Mock database object
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

  // Add required methods from Connection interface
  constructor() {
    super();
    this.setMaxListeners(0);
  }

  // Core connection methods
  async close(): Promise<void> {
    this.emit('close');
    return Promise.resolve();
  }

  async asPromise(): Promise<this> {
    return Promise.resolve(this);
  }

  // Collection-related methods
  collection(name: string, options?: any): any {
    return {
      name,
      insertOne: async () => ({ insertedId: 'mock-id' }),
      findOne: async () => null,
      find: async () => ({ toArray: async () => [] }),
      updateOne: async () => ({ modifiedCount: 1 }),
      deleteOne: async () => ({ deletedCount: 1 })
    };
  }

  // Updated model method signature to match Connection interface
  model<TSchema extends Schema = any>(
    name: string, 
    schema?: TSchema, 
    collection?: string, 
    options?: CompileModelOptions
  ): any {
    const MockModel: any = function() {};
    
    // Add static methods to the mock model
    MockModel.find = jest.fn().mockResolvedValue([]);
    MockModel.findOne = jest.fn().mockResolvedValue(null);
    MockModel.findById = jest.fn().mockResolvedValue(null);
    MockModel.create = jest.fn().mockResolvedValue({ _id: 'mock-id' });
    MockModel.updateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });
    MockModel.deleteOne = jest.fn().mockResolvedValue({ deletedCount: 1 });
    MockModel.countDocuments = jest.fn().mockResolvedValue(0);
    
    return MockModel;
  }

  // Session-related methods
  startSession(options?: any): Promise<ClientSession> {
    const mockSession: Partial<ClientSession> = {
      endSession: async () => {},
      withTransaction: async (fn) => fn(mockSession as ClientSession),
      abortTransaction: async () => {},
      commitTransaction: async () => {},
      startTransaction: async () => {},
    };
    return Promise.resolve(mockSession as ClientSession);
  }

  // Connection lifecycle methods - fixed return type
  openUri(uri: string, options?: ConnectOptions): Promise<Connection> {
    return Promise.resolve(this);
  }

  createConnection(uri: string, options?: ConnectOptions): Connection {
    return this;
  }

  deleteModel(name: string): this {
    return this;
  }

  destroy(): Promise<void> {
    return Promise.resolve();
  }

  // Mongoose feature methods
  get modelNames(): string[] {
    return [];
  }

  // Implement remaining methods to match interface
  useDb(name: string, options?: any): Connection {
    return this;
  }

  // Add stub methods for any other required methods
  startSession = jest.fn().mockResolvedValue({
    endSession: jest.fn(),
    abortTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    startTransaction: jest.fn(),
  });

  transaction = jest.fn().mockImplementation((fn) => Promise.resolve(fn({} as any)));
  
  watch = jest.fn().mockReturnValue({
    on: jest.fn().mockReturnThis(),
    close: jest.fn(),
  });

  // Database operation methods
  aggregate = jest.fn().mockResolvedValue([]);

  // Adding the missing methods from Connection interface
  createCollection(name: string, options?: CollectionOptions): Promise<any> {
    return Promise.resolve({
      name,
      insertOne: async () => ({ insertedId: 'mock-id' }),
      findOne: async () => null
    });
  }

  createCollections(): Promise<Collection[]> {
    return Promise.resolve([]);
  }

  dropCollection(name: string): Promise<boolean> {
    return Promise.resolve(true);
  }

  dropDatabase(): Promise<void> {
    return Promise.resolve();
  }

  syncIndexes(options?: Record<string, any>): Promise<any> {
    return Promise.resolve({ results: {}, dropped: [] });
  }

  listCollections(options?: Record<string, any>): Promise<any> {
    return Promise.resolve([]);
  }

  on(event: string | symbol, listener: (...args: any[]) => void): this {
    super.on(event, listener);
    return this;
  }

  once(event: string | symbol, listener: (...args: any[]) => void): this {
    super.once(event, listener);
    return this;
  }

  addListener(event: string | symbol, listener: (...args: any[]) => void): this {
    super.addListener(event, listener);
    return this;
  }

  removeListener(event: string | symbol, listener: (...args: any[]) => void): this {
    super.removeListener(event, listener);
    return this;
  }

  // Additional required methods
  get then(): undefined {
    return undefined;
  }

  get catch(): undefined {
    return undefined;
  }

  get finally(): undefined {
    return undefined;
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
export function getMockConnection(logger?: Logger): Connection {
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

// Polyfill for jest functions in non-test environments
const jest = {
  fn: () => {
    const fn = (...args: any[]) => {
      fn.mock.calls.push(args);
      return fn.mock.results[fn.mock.calls.length - 1]?.value;
    };
    fn.mock = {
      calls: [],
      results: [],
      instances: [],
    };
    fn.mockReturnValue = (val: any) => {
      fn.mock.results.push({ type: 'return', value: val });
      return fn;
    };
    fn.mockResolvedValue = (val: any) => {
      fn.mock.results.push({ type: 'return', value: Promise.resolve(val) });
      return fn;
    };
    fn.mockImplementation = (implementation: (...args: any[]) => any) => {
      const mockImplementationFn = (...args: any[]) => {
        fn.mock.calls.push(args);
        const result = implementation(...args);
        fn.mock.results.push({ type: 'return', value: result });
        return result;
      };
      return mockImplementationFn;
    };
    return fn;
  }
};
