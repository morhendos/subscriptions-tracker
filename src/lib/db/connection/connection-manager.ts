/**
 * MongoDB Connection Manager
 * 
 * A singleton class that manages MongoDB connections with proper connection
 * pooling, retry mechanisms, and lifecycle management.
 */
import mongoose, { Connection, ConnectOptions } from 'mongoose';
import { ReadPreference } from 'mongodb';
import { mongodbConfig } from '@/config/database-config';
import { normalizeMongoURI, getSanitizedURI } from '@/utils/mongodb-uri';
import { Logger } from '../logger/logger';

/**
 * Connection options interface
 */
export interface ConnectionOptions {
  /**
   * Use a direct (non-pooled) connection
   * @default false
   */
  direct?: boolean;
  
  /**
   * Database name override
   */
  dbName?: string;
  
  /**
   * Connection timeout in milliseconds
   */
  timeoutMS?: number;
  
  /**
   * Server selection timeout in milliseconds
   */
  serverSelectionTimeoutMS?: number;
  
  /**
   * Enable debug mode
   * @default false
   */
  debug?: boolean;
}

/**
 * Global cache interface for mongoose connections
 */
interface ConnectionCache {
  connection: Connection | null;
  promise: Promise<Connection> | null;
}

// Define global variable for connection cache
declare global {
  var __mongoConnectionCache: ConnectionCache | undefined;
}

/**
 * MongoDB Connection Manager
 * 
 * Manages MongoDB connections with connection pooling, retry mechanisms,
 * and proper error handling.
 */
export class ConnectionManager {
  private readonly logger: Logger;
  private readonly isDevelopment: boolean;
  private directConnections: Connection[] = [];
  
  // Cache the singleton instance
  private static instance: ConnectionManager;
  
  /**
   * Create a new connection manager instance
   * @param logger - Logger instance
   */
  private constructor(logger: Logger) {
    this.logger = logger;
    this.isDevelopment = process.env.NODE_ENV === 'development';
    
    // Set mongoose debug mode if needed
    if (this.isDevelopment && mongodbConfig.development.logOperations) {
      mongoose.set('debug', true);
    }
  }
  
  /**
   * Get the singleton connection manager instance
   * @param logger - Logger instance
   * @returns The connection manager instance
   */
  public static getInstance(logger: Logger): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager(logger);
    }
    return ConnectionManager.instance;
  }
  
  /**
   * Get a MongoDB connection
   * @param options - Connection options
   * @returns A promise resolving to a mongoose connection
   */
  public async getConnection(options: ConnectionOptions = {}): Promise<Connection> {
    return options.direct 
      ? this.createDirectConnection(options)
      : this.getPooledConnection(options);
  }
  
  /**
   * Get a pooled connection from the global cache
   * @param options - Connection options
   * @returns A promise resolving to a mongoose connection
   */
  private async getPooledConnection(options: ConnectionOptions = {}): Promise<Connection> {
    // Initialize the global cache if needed
    if (!global.__mongoConnectionCache) {
      global.__mongoConnectionCache = {
        connection: null,
        promise: null
      };
    }
    
    const cache = global.__mongoConnectionCache;
    
    // Return existing connection if available
    if (cache.connection) {
      this.logger.debug('Using cached database connection');
      return cache.connection;
    }
    
    // Create the connection promise if it doesn't exist
    if (!cache.promise) {
      const dbName = options.dbName || mongodbConfig.databaseName;
      
      cache.promise = this.createConnection(dbName, options)
        .catch(error => {
          cache.promise = null;
          this.logger.error('Failed to establish pooled connection', { error });
          throw error;
        });
    }
    
    try {
      // Wait for the connection and store it in the cache
      cache.connection = await cache.promise;
      return cache.connection;
    } catch (error) {
      cache.promise = null;
      throw error;
    }
  }
  
  /**
   * Create a direct (non-pooled) connection
   * @param options - Connection options
   * @returns A promise resolving to a mongoose connection
   */
  private async createDirectConnection(options: ConnectionOptions = {}): Promise<Connection> {
    const dbName = options.dbName || mongodbConfig.databaseName;
    const connection = await this.createConnection(dbName, options);
    
    // Track this connection for cleanup
    this.directConnections.push(connection);
    
    return connection;
  }
  
  /**
   * Create a new MongoDB connection with retry mechanism
   * @param dbName - Database name
   * @param options - Connection options
   * @returns A promise resolving to a mongoose connection
   */
  private async createConnection(
    dbName: string,
    options: ConnectionOptions
  ): Promise<Connection> {
    return this.connectWithRetry(dbName, options);
  }
  
  /**
   * Connect to MongoDB with retry mechanism
   * @param dbName - Database name
   * @param options - Connection options
   * @param retryCount - Current retry count
   * @returns A promise resolving to a mongoose connection
   */
  private async connectWithRetry(
    dbName: string,
    options: ConnectionOptions,
    retryCount = 0
  ): Promise<Connection> {
    try {
      // Check for MongoDB URI
      if (!mongodbConfig.uri) {
        throw new Error('MONGODB_URI environment variable is not defined');
      }
      
      // Normalize the URI
      const normalizedUri = normalizeMongoURI(mongodbConfig.uri, dbName);
      const sanitizedUri = getSanitizedURI(normalizedUri);
      
      this.logger.debug(`Connecting to MongoDB: ${sanitizedUri}`, {
        database: dbName,
        connectionType: options.direct ? 'direct' : 'pooled'
      });
      
      // Create connection options
      const mongooseOptions = this.createMongooseOptions(options);
      
      // Connect to MongoDB
      const conn = await mongoose.connect(normalizedUri, mongooseOptions);
      
      this.logger.info(`Connected successfully to MongoDB database: ${dbName}`);
      
      // Set up connection event listeners
      this.setupConnectionListeners(conn.connection);
      
      return conn.connection;
    } catch (error: any) {
      // Handle retry logic
      if (retryCount < mongodbConfig.maxRetries) {
        const delay = mongodbConfig.retryDelayMS * Math.pow(2, retryCount);
        
        this.logger.warn(`Connection attempt ${retryCount + 1} failed. Retrying in ${delay}ms...`, {
          error: error.message,
          retryCount,
          nextRetryDelay: delay
        });
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.connectWithRetry(dbName, options, retryCount + 1);
      }
      
      // Max retries exceeded
      this.logger.error(`Failed to connect to MongoDB after ${mongodbConfig.maxRetries} attempts`, {
        error: error.message,
        retryCount
      });
      
      throw error;
    }
  }
  
  /**
   * Create MongoDB connection options from ConnectionOptions
   * @param options - Connection options
   * @returns Mongoose connection options
   */
  private createMongooseOptions(options: ConnectionOptions): ConnectOptions {
    // Create read preference
    const readPref = new ReadPreference(mongodbConfig.readPreference);
    
    return {
      // Connection pool settings
      maxPoolSize: mongodbConfig.maxPoolSize,
      minPoolSize: mongodbConfig.minPoolSize,
      
      // Timeout settings
      serverSelectionTimeoutMS: options.serverSelectionTimeoutMS || mongodbConfig.serverSelectionTimeoutMS,
      socketTimeoutMS: mongodbConfig.socketTimeoutMS,
      connectTimeoutMS: options.timeoutMS || mongodbConfig.connectionTimeoutMS,
      maxIdleTimeMS: mongodbConfig.maxIdleTimeMS,
      
      // Read/write preferences
      readPreference: readPref,
      writeConcern: {
        w: mongodbConfig.writeConcern,
        j: true, // Journal
      },
      
      // Other settings
      autoIndex: mongodbConfig.autoIndex,
      autoCreate: mongodbConfig.autoCreate,
      retryWrites: mongodbConfig.retryWrites,
      retryReads: mongodbConfig.retryReads,
      ssl: mongodbConfig.ssl,
      authSource: mongodbConfig.authSource,
      
      // Compression if configured
      ...(mongodbConfig.compressors ? { compressors: mongodbConfig.compressors } : {})
    };
  }
  
  /**
   * Set up event listeners for a connection
   * @param connection - Mongoose connection
   */
  private setupConnectionListeners(connection: Connection): void {
    // Remove any existing listeners to prevent duplicates
    connection.removeAllListeners();
    
    // Set up event handlers
    connection.on('disconnected', () => {
      this.logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });
    
    connection.on('reconnected', () => {
      this.logger.info('MongoDB reconnected successfully');
    });
    
    connection.on('error', (err) => {
      this.logger.error('MongoDB connection error', { error: err });
    });
    
    // Additional monitoring events could be set up here
  }
  
  /**
   * Close all direct connections created by this manager
   */
  public async cleanup(): Promise<void> {
    // Close all direct connections
    for (const connection of this.directConnections) {
      try {
        // Only disconnect if this is not the global cached connection
        const cache = global.__mongoConnectionCache;
        
        if (!cache || connection !== cache.connection) {
          await connection.close();
          this.logger.debug('Direct connection closed');
        }
      } catch (error) {
        this.logger.error('Error closing connection', { error });
      }
    }
    
    // Clear the connections array
    this.directConnections = [];
  }
  
  /**
   * Disconnect all mongoose connections including the cached ones
   */
  public async disconnectAll(): Promise<void> {
    try {
      await mongoose.disconnect();
      
      if (global.__mongoConnectionCache) {
        global.__mongoConnectionCache.connection = null;
        global.__mongoConnectionCache.promise = null;
      }
      
      this.directConnections = [];
      
      this.logger.info('All database connections closed');
    } catch (error) {
      this.logger.error('Error disconnecting all connections', { error });
      throw error;
    }
  }
}
