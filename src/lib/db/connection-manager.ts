/**
 * MongoDB Connection Manager
 * 
 * Provides a unified interface for MongoDB connections with support for
 * both cached (pooled) and direct connections. Implements proper connection
 * management, error handling, and cleanup.
 */

import mongoose from 'mongoose';
import { ReadPreference } from 'mongodb';
import { normalizeMongoURI, getSanitizedURI } from '@/utils/mongodb-utils';
import { dbConfig, monitoringConfig, isDevelopment } from '@/config/database';

// Define types for connection options
export interface ConnectionOptions {
  // Whether to use a direct (non-pooled) connection
  direct?: boolean;
  
  // Database name to use
  dbName?: string;
  
  // Custom connection timeout in milliseconds
  timeoutMS?: number;
  
  // Custom server selection timeout in milliseconds
  serverSelectionTimeoutMS?: number;
  
  // Whether to enable debugging
  debug?: boolean;
}

// Type for global cache
interface GlobalMongoose {
  conn: mongoose.Connection | null;
  promise: Promise<mongoose.Connection> | null;
}

// Define global cache for mongoose connections
declare global {
  var mongoose: GlobalMongoose | undefined;
}

// Initialize cached connection
const cached: GlobalMongoose = global.mongoose ?? { conn: null, promise: null };
if (!global.mongoose) {
  global.mongoose = cached;
}

/**
 * MongoDB Connection Factory
 * 
 * Manages MongoDB connections with support for pooling, retries, and cleanup.
 */
export class MongoConnectionFactory {
  private connections: mongoose.Connection[] = [];
  private logger: Console;

  /**
   * Creates a new MongoDB connection factory
   * 
   * @param options - Options for the connection factory
   */
  constructor(private options: ConnectionOptions = {}) {
    this.logger = console;
    
    // Enable mongoose debugging if requested
    if (options.debug || (isDevelopment && dbConfig.logOperations)) {
      mongoose.set('debug', true);
    }
  }

  /**
   * Get a MongoDB connection
   * 
   * @param options - Connection options (overrides constructor options)
   * @returns A promise resolving to a mongoose connection
   */
  async getConnection(options?: ConnectionOptions): Promise<mongoose.Connection> {
    const opts = { ...this.options, ...options };
    
    // Use direct connection if requested
    if (opts.direct) {
      return this.createDirectConnection(opts);
    }
    
    // Otherwise use pooled connection
    return this.getPooledConnection(opts);
  }

  /**
   * Get a pooled (cached) MongoDB connection
   * 
   * @param options - Connection options
   * @returns A promise resolving to a mongoose connection
   */
  private async getPooledConnection(options: ConnectionOptions = {}): Promise<mongoose.Connection> {
    // If already connected, return existing connection
    if (cached.conn) {
      this.logger.debug('[MongoDB] Using cached connection');
      return cached.conn;
    }

    // If connection is in progress, wait for it
    if (!cached.promise) {
      const dbName = options.dbName || dbConfig.databaseName;
      
      // Setup connection promise
      cached.promise = this.createConnection(dbName, {
        ...options,
        direct: false,
      }).catch((error) => {
        this.logger.error('[MongoDB] Failed to establish pooled connection:', error);
        cached.promise = null;
        throw error;
      });
    }

    try {
      // Wait for connection and store it in the cache
      cached.conn = await cached.promise;
      return cached.conn;
    } catch (error) {
      cached.promise = null;
      throw error;
    }
  }

  /**
   * Create a direct (non-pooled) MongoDB connection
   * 
   * @param options - Connection options
   * @returns A promise resolving to a mongoose connection
   */
  private async createDirectConnection(options: ConnectionOptions = {}): Promise<mongoose.Connection> {
    const dbName = options.dbName || dbConfig.databaseName;
    const connection = await this.createConnection(dbName, {
      ...options,
      direct: true,
    });
    
    // Track this connection for cleanup
    this.connections.push(connection);
    
    return connection;
  }

  /**
   * Create a new MongoDB connection with retry mechanism
   * 
   * @param dbName - Database name
   * @param options - Connection options
   * @returns Promise resolving to a mongoose connection
   */
  private async createConnection(
    dbName: string,
    options: ConnectionOptions
  ): Promise<mongoose.Connection> {
    return this.connectWithRetry(dbName, options);
  }

  /**
   * Connect to MongoDB with retry mechanism
   * 
   * @param dbName - Database name
   * @param options - Connection options
   * @param retryCount - Current retry count (internal)
   * @returns Promise resolving to a mongoose connection
   */
  private async connectWithRetry(
    dbName: string,
    options: ConnectionOptions,
    retryCount = 0
  ): Promise<mongoose.Connection> {
    try {
      // Get configurations
      const uri = dbConfig.uri;
      if (!uri) {
        throw new Error('MONGODB_URI environment variable is not defined');
      }

      // Normalize URI
      const normalizedUri = normalizeMongoURI(uri, dbName);
      
      // Log connection attempt (sanitized)
      const sanitizedUri = getSanitizedURI(normalizedUri);
      this.logger.debug(`[MongoDB] Connecting to: ${sanitizedUri} (${options.direct ? 'direct' : 'pooled'})`);

      // Prepare connection options
      const connectionOptions = this.getMongooseOptions(options);

      // Connect to MongoDB
      const mongooseInstance = await mongoose.connect(normalizedUri, connectionOptions);
      
      this.logger.debug(`[MongoDB] Connected successfully to ${dbName}`);
      
      // Set up event listeners
      this.setupConnectionListeners(mongooseInstance.connection);

      return mongooseInstance.connection;
    } catch (error: any) {
      // Handle retry logic
      if (retryCount < (dbConfig.maxRetries || 3)) {
        const delay = dbConfig.retryDelayMS * Math.pow(2, retryCount);
        this.logger.warn(`[MongoDB] Connection attempt ${retryCount + 1} failed. Retrying in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.connectWithRetry(dbName, options, retryCount + 1);
      }

      // Max retries exceeded
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`[MongoDB] Failed to connect after ${dbConfig.maxRetries} attempts: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Build mongoose connection options
   * 
   * @param options - Our connection options
   * @returns Mongoose-compatible connection options
   */
  private getMongooseOptions(options: ConnectionOptions): mongoose.ConnectOptions {
    // Create a read preference instance
    const readPref = new ReadPreference(dbConfig.readPreference);

    return {
      // Connection pool settings
      maxPoolSize: dbConfig.maxPoolSize,
      minPoolSize: dbConfig.minPoolSize,
      
      // Timeouts
      serverSelectionTimeoutMS: options.serverSelectionTimeoutMS || dbConfig.serverSelectionTimeoutMS,
      socketTimeoutMS: dbConfig.socketTimeoutMS,
      connectTimeoutMS: options.timeoutMS || dbConfig.connectionTimeoutMS,
      maxIdleTimeMS: dbConfig.maxIdleTimeMS,
      
      // Read/write preferences
      readPreference: readPref,
      writeConcern: {
        w: dbConfig.writeConcern,
        j: true,  // Journal
      },
      
      // Other settings
      autoIndex: dbConfig.autoIndex,
      retryWrites: dbConfig.retryWrites,
      retryReads: dbConfig.retryReads,
      ssl: dbConfig.ssl,
      authSource: dbConfig.authSource,
    };
  }

  /**
   * Set up connection event listeners
   * 
   * @param connection - Mongoose connection to attach listeners to
   */
  private setupConnectionListeners(connection: mongoose.Connection): void {
    // Remove any existing listeners
    connection.removeAllListeners();
    
    // Add new listeners
    connection.on('disconnected', () => {
      this.logger.warn('[MongoDB] Disconnected. Attempting to reconnect...');
    });

    connection.on('reconnected', () => {
      this.logger.info('[MongoDB] Reconnected successfully');
    });

    connection.on('error', (err) => {
      this.logger.error('[MongoDB] Connection error:', err);
    });

    // Setup monitoring in production or when explicitly enabled
    if (monitoringConfig.enabled) {
      this.setupMonitoring(connection);
    }
  }

  /**
   * Set up monitoring for the connection
   * 
   * @param connection - Mongoose connection to monitor
   */
  private setupMonitoring(connection: mongoose.Connection): void {
    const config = monitoringConfig;
    
    connection.on('commandStarted', (event) => {
      const monitoredCommands = ['find', 'insert', 'update', 'delete', 'aggregate'];
      if (monitoredCommands.includes(event.commandName)) {
        this.logger.debug(`[MongoDB] Command ${event.commandName} started`, {
          namespace: event.databaseName,
          commandName: event.commandName,
          timestamp: new Date().toISOString()
        });
      }
    });

    connection.on('commandSucceeded', (event) => {
      const monitoredCommands = ['find', 'insert', 'update', 'delete', 'aggregate'];
      if (monitoredCommands.includes(event.commandName)) {
        const latency = event.duration;
        
        // Log slow queries
        const threshold = event.commandName === 'aggregate' 
          ? config.alerts.queryPerformance.aggregationThresholdMs 
          : config.alerts.queryPerformance.slowQueryThresholdMs;

        if (latency > threshold) {
          this.logger.warn(`[MongoDB] Slow ${event.commandName} detected (${latency}ms > ${threshold}ms)`);
        }
      }
    });

    connection.on('commandFailed', (event) => {
      this.logger.error(`[MongoDB] Command ${event.commandName} failed:`, event.failure);
    });
  }

  /**
   * Clean up all connections created by this factory
   */
  async cleanup(): Promise<void> {
    // Close all direct connections
    for (const connection of this.connections) {
      try {
        // Only disconnect if this is not the global cached connection
        if (connection !== cached.conn) {
          await mongoose.disconnect();
          this.logger.debug('[MongoDB] Direct connection closed');
        }
      } catch (error) {
        this.logger.error('[MongoDB] Error closing connection:', error);
      }
    }
    
    // Clear the connections array
    this.connections = [];
  }

  /**
   * Static method to disconnect all mongoose connections
   * Including the cached connection
   */
  static async disconnectAll(): Promise<void> {
    try {
      await mongoose.disconnect();
      cached.conn = null;
      cached.promise = null;
      console.debug('[MongoDB] All connections closed');
    } catch (error) {
      console.error('[MongoDB] Error disconnecting all connections:', error);
    }
  }
}