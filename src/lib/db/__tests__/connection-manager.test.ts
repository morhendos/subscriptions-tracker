/**
 * Tests for MongoConnectionManager
 * 
 * Tests the functionality of the refactored MongoDB connection manager.
 */

import mongoose from 'mongoose';
import { EventEmitter } from 'events';
import MongoConnectionManager, { Logger } from '../connection-manager';
import { MongoDBError } from '../error-handler';

// Mock mongoose
jest.mock('mongoose', () => {
  const originalModule = jest.requireActual('mongoose');
  
  // Create a mock mongoose instance
  const mockMongoose = {
    ...originalModule,
    connect: jest.fn(),
    disconnect: jest.fn().mockResolvedValue(undefined),
    set: jest.fn(),
    get: jest.fn().mockReturnValue(false),
    connection: {
      readyState: 1, // Connected state
      on: jest.fn(),
      removeAllListeners: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
      db: {
        admin: () => ({
          ping: jest.fn().mockResolvedValue({ ok: 1 }),
          serverStatus: jest.fn().mockResolvedValue({
            connections: {
              current: 5,
              available: 100,
              active: 3
            },
            opcounters: {
              insert: 10,
              query: 50,
              update: 20,
              delete: 5
            },
            mem: {
              resident: 100,
              virtual: 200
            }
          }),
          command: jest.fn().mockResolvedValue({
            inprog: []
          })
        })
      },
      id: 'test-connection-id'
    }
  };
  
  // Mock Mongoose class constructor
  mockMongoose.Mongoose = jest.fn().mockImplementation(() => ({
    ...mockMongoose,
    connect: jest.fn().mockResolvedValue(mockMongoose),
    connection: { ...mockMongoose.connection }
  }));
  
  return mockMongoose;
});

// Mock MongoDB utilities
jest.mock('@/utils/mongodb-utils', () => ({
  normalizeMongoURI: jest.fn().mockReturnValue('mongodb://normalized-uri/test'),
  getSanitizedURI: jest.fn().mockReturnValue('mongodb://sanitized-uri/test')
}));

// Mock database config
jest.mock('@/config/database', () => ({
  dbConfig: {
    uri: 'mongodb://localhost:27017/test',
    databaseName: 'test',
    maxPoolSize: 10,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 30000,
    connectionTimeoutMS: 10000,
    maxIdleTimeMS: 60000,
    maxRetries: 3,
    retryDelayMS: 1000,
    writeConcern: 'majority',
    readPreference: 'primary',
    autoIndex: true,
    retryWrites: true,
    retryReads: true,
    ssl: false,
    authSource: 'admin',
    compressors: ['zlib']
  },
  monitoringConfig: {
    enabled: false,
    metricsIntervalSeconds: 60,
    alerts: {
      queryPerformance: {
        slowQueryThresholdMs: 100,
        aggregationThresholdMs: 1000
      },
      connectionPoolUtilization: {
        threshold: 80,
        criticalThreshold: 90
      },
      replication: {
        maxLagSeconds: 10
      }
    }
  },
  isDevelopment: true
}));

// Create a custom test logger
class TestLogger implements Logger {
  logs: Record<string, string[]> = {
    debug: [],
    info: [],
    warn: [],
    error: []
  };

  debug(message: string, ...args: any[]): void {
    this.logs.debug.push(message);
  }

  info(message: string, ...args: any[]): void {
    this.logs.info.push(message);
  }

  warn(message: string, ...args: any[]): void {
    this.logs.warn.push(message);
  }

  error(message: string, ...args: any[]): void {
    this.logs.error.push(message);
  }

  reset() {
    this.logs = {
      debug: [],
      info: [],
      warn: [],
      error: []
    };
  }
}

describe('MongoConnectionManager', () => {
  let instance: MongoConnectionManager;
  let testLogger: TestLogger;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Reset global mongoose
    global.mongoose = { conn: null, promise: null };
    
    // Reset MongoConnectionManager instance
    // @ts-ignore - Accessing private static property for testing
    MongoConnectionManager.instance = null;
    
    // Create new test logger
    testLogger = new TestLogger();
    
    // Get manager instance
    instance = MongoConnectionManager.getInstance({ logger: testLogger });
  });

  afterEach(async () => {
    // Clean up after each test
    await MongoConnectionManager.disconnectAll();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = MongoConnectionManager.getInstance();
      const instance2 = MongoConnectionManager.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('should accept options in constructor', () => {
      const customLogger = new TestLogger();
      const instance = MongoConnectionManager.getInstance({ logger: customLogger });
      
      // @ts-ignore - Accessing private property for testing
      expect(instance.logger).toBe(customLogger);
    });
  });

  describe('getConnection', () => {
    it('should create a pooled connection when direct is not specified', async () => {
      const connection = await instance.getConnection();
      
      expect(mongoose.connect).toHaveBeenCalled();
      expect(connection).toBe(mongoose.connection);
    });

    it('should create a direct connection when specified', async () => {
      const connection = await instance.getConnection({ direct: true });
      
      // Should create a new mongoose instance
      expect(mongoose.Mongoose).toHaveBeenCalled();
      expect(connection).not.toBe(mongoose.connection);
    });

    it('should use cached connection if available', async () => {
      // First connection establishes the cache
      await instance.getConnection();
      
      // Reset connect mock to verify it's not called again
      (mongoose.connect as jest.Mock).mockClear();
      
      // Second connection should use the cache
      const connection = await instance.getConnection();
      
      expect(mongoose.connect).not.toHaveBeenCalled();
      expect(connection).toBe(mongoose.connection);
    });

    it('should handle connection errors', async () => {
      // Mock connection failure
      (mongoose.connect as jest.Mock).mockRejectedValueOnce(new Error('Connection failed'));
      
      await expect(instance.getConnection()).rejects.toThrow();
      expect(testLogger.logs.error.length).toBeGreaterThan(0);
    });
  });

  describe('checkHealth', () => {
    it('should return healthy status for active connection', async () => {
      // Get a connection first
      const connection = await instance.getConnection();
      
      // Check health
      const health = await instance.checkHealth(connection);
      
      expect(health.status).toBe('healthy');
      expect(health.latency).toBeGreaterThanOrEqual(0);
      expect(health.details).toBeDefined();
    });

    it('should return unhealthy status when no connection exists', async () => {
      // Mock no connection
      global.mongoose = { conn: null, promise: null };
      
      // Check health
      const health = await instance.checkHealth();
      
      expect(health.status).toBe('unhealthy');
      expect(health.details?.message).toBe('No active connection available');
    });

    it('should return unhealthy status when ping fails', async () => {
      // Get a connection first
      const connection = await instance.getConnection();
      
      // Mock ping failure
      connection.db.admin().ping.mockRejectedValueOnce(new Error('Ping failed'));
      
      // Check health
      const health = await instance.checkHealth(connection);
      
      expect(health.status).toBe('unhealthy');
      expect(health.details?.error).toBe('Ping failed');
    });
  });

  describe('cleanup', () => {
    it('should close all direct connections', async () => {
      // Create a direct connection
      const connection = await instance.getConnection({ direct: true });
      
      // Clean up
      await instance.cleanup();
      
      // Verify connection was closed
      expect(connection.close).toHaveBeenCalled();
    });

    it('should not close cached connection', async () => {
      // Create a pooled connection (cached)
      await instance.getConnection();
      
      // Create a direct connection
      await instance.getConnection({ direct: true });
      
      // Clean up
      await instance.cleanup();
      
      // Verify disconnect was not called (since we're not disconnecting cached connections)
      expect(mongoose.disconnect).not.toHaveBeenCalled();
    });
  });

  describe('disconnectAll', () => {
    it('should disconnect all connections including cached', async () => {
      // Create a pooled connection (cached)
      await instance.getConnection();
      
      // Disconnect all
      await MongoConnectionManager.disconnectAll();
      
      // Verify disconnect was called
      expect(mongoose.disconnect).toHaveBeenCalled();
      
      // Verify cache was cleared
      expect(global.mongoose.conn).toBeNull();
      expect(global.mongoose.promise).toBeNull();
    });
  });
});
