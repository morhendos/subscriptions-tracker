/**
 * MongoDB Connection Manager (Refactored)
 * 
 * Provides a unified interface for MongoDB connections with support for
 * both cached (pooled) and direct connections. Implements proper connection
 * management, error handling, and cleanup.
 * 
 * Phase 2 Improvements:
 * - Proper dependency injection
 * - Enhanced connection lifecycle management
 * - Improved error handling
 * - Event-driven architecture
 * - Better connection pooling
 * - Monitoring and logging integration
 */

import mongoose, { Connection } from 'mongoose';
import { ReadPreference } from 'mongodb';
import { EventEmitter } from 'events';
import { normalizeMongoURI, getSanitizedURI } from '@/utils/mongodb-uri';
import { dbConfig, monitoringConfig, isDevelopment, isBuildTime, isStaticGeneration } from '@/config/database';
import { MongoDBError, MongoDBErrorCode, handleMongoError } from './error-handler';

// Define interfaces for logger to enable dependency injection
export interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

// Default logger implementation
export class ConsoleLogger implements Logger {
  debug(message: string, ...args: any[]): void {
    console.debug(message, ...args);
  }
  
  info(message: string, ...args: any[]): void {
    console.info(message, ...args);
  }
  
  warn(message: string, ...args: any[]): void {
    console.warn(message, ...args);
  }
  
  error(message: string, ...args: any[]): void {
    console.error(message, ...args);
  }
}

// Define interfaces for connection options
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
  
  // Custom logger
  logger?: Logger;
  
  // Auto-reconnect policy
  autoReconnect?: boolean;
  
  // Maximum number of reconnect attempts
  maxReconnectAttempts?: number;

  // Force the use of a mock connection
  forceMock?: boolean;
}

// Type for connection events
export interface ConnectionEvents {
  connected: (connection: Connection) => void;
  disconnected: (connection: Connection) => void;
  error: (error: Error, connection: Connection) => void;
  reconnected: (connection: Connection) => void;
  close: (connection: Connection) => void;
  monitoring: (metrics: any, connection: Connection) => void;
}

// Type for global cache
interface GlobalMongoose {
  conn: Connection | null;
  promise: Promise<Connection> | null;
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
 * Create a mock MongoDB connection
 * Used during build/static generation to prevent real DB connections
 */
function createMockConnection(): Connection {
  const mockConnection = {
    // Base Connection properties
    readyState: 1, // Connected
    db: {
      admin: () => ({
        ping: async () => ({ ok: 1 }),
        serverStatus: async () => ({
          connections: { current: 1, available: 100, active: 1 },
          opcounters: { query: 0, insert: 0, update: 0, delete: 0, getmore: 0, command: 0 },
          mem: { bits: 64, resident: 0, virtual: 0 }
        }),
        command: async () => ({ ok: 1 }),
        listDatabases: async () => ({ databases: [{ name: 'mock_db' }] })
      }),
      collection: () => ({
        find: () => ({
          toArray: async () => []
        }),
        findOne: async () => null,
        insertOne: async () => ({ insertedId: 'mock_id' }),
        updateOne: async () => ({ modifiedCount: 1 }),
        deleteOne: async () => ({ deletedCount: 1 })
      }),
      collections: async () => [],
      databaseName: 'mock_db'
    },
    id: 'mock-connection-id',
    name: 'mock-connection',
    host: 'localhost',
    close: async () => {},
    on: (event: string, callback: any) => mockConnection, // Return self for chaining
    once: (event: string, callback: any) => mockConnection,
    removeAllListeners: () => mockConnection,
    emit: () => true
  } as unknown as Connection;

  return mockConnection;
}

/**
 * MongoDB Connection Factory
 * 
 * Manages MongoDB connections with support for pooling, retries, and cleanup.
 * Implements event-driven architecture for connection lifecycle events.
 */
export class MongoConnectionManager extends EventEmitter {
  private connections: Connection[] = [];
  private readonly logger: Logger;
  private connectionStatus: Map<string, string> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private metricsInterval: NodeJS.Timeout | null = null;
  private static instance: MongoConnectionManager | null = null;
  
  /**
   * Get the singleton instance of the connection manager
   * 
   * @param options - Options for the connection manager
   * @returns The singleton instance
   */
  public static getInstance(options?: ConnectionOptions): MongoConnectionManager {
    if (!MongoConnectionManager.instance) {
      MongoConnectionManager.instance = new MongoConnectionManager(options);
    }
    return MongoConnectionManager.instance;
  }

  /**
   * Creates a new MongoDB connection manager
   * 
   * @param options - Options for the connection manager
   */
  private constructor(private options: ConnectionOptions = {}) {
    super();
    
    // Set up logger (use injected logger or default to console)
    this.logger = options.logger || new ConsoleLogger();
    
    // Enable mongoose debugging if requested
    if (options.debug || (isDevelopment && dbConfig.logOperations)) {
      mongoose.set('debug', true);
    }
    
    // Set up connection event listeners
    this.setupGlobalEventListeners();
    
    // Set up metrics collection if monitoring is enabled
    if (monitoringConfig.enabled) {
      this.setupMetricsCollection();
    }
  }

  /**
   * Determine if we should use a mock connection
   * 
   * @param options - Connection options
   * @returns True if we should use a mock connection
   */
  private shouldUseMockConnection(options: ConnectionOptions = {}): boolean {
    // Always use mock if explicitly requested
    if (options.forceMock) {
      this.logger.debug('[MongoDB] Using mock connection (force mock)');
      return true;
    }

    // Use mock during build/static generation
    if (isBuildTime || isStaticGeneration) {
      this.logger.debug('[MongoDB] Using mock connection (build time detection)');
      return true;
    }

    // Use mock if enabled via environment variable
    if (process.env.USE_MOCK_DB === 'true') {
      this.logger.debug('[MongoDB] Using mock connection (USE_MOCK_DB=true)');
      return true;
    }

    return false;
  }

  /**
   * Set up global event listeners for mongoose
   */
  private setupGlobalEventListeners(): void {
    // These events are for the mongoose module in general
    mongoose.connection.on('disconnected', () => {
      this.logger.warn('[MongoDB] Global connection disconnected');
    });

    mongoose.connection.on('error', (err) => {
      this.logger.error('[MongoDB] Global connection error:', err);
    });
  }

  /**
   * Set up metrics collection interval
   */
  private setupMetricsCollection(): void {
    const intervalMs = monitoringConfig.metricsInterval * 1000;

    this.metricsInterval = setInterval(() => {
      this.collectMetrics()
        .then(metrics => {
          // Only emit if we have active connections
          if (this.connections.length > 0 || cached.conn) {
            this.emit('monitoring', metrics);
          }
        })
        .catch(error => {
          this.logger.error('[MongoDB] Error collecting metrics:', error);
        });
    }, intervalMs);
  }

  /**
   * Collect metrics from all active connections
   * 
   * @returns Promise resolving to metrics object
   */
  private async collectMetrics(): Promise<any> {
    const metrics: any = {
      timestamp: new Date().toISOString(),
      activeConnections: this.connections.length + (cached.conn ? 1 : 0),
      connectionStatus: Object.fromEntries(this.connectionStatus),
      poolStats: null
    };

    // Try to get connection pool stats from an active connection
    const connection = cached.conn || (this.connections[0] ?? null);
    if (connection && connection.db) {
      try {
        // Set a timeout for metrics collection to avoid blocking
        const adminDb = connection.db.admin();
        
        // Use Promise.race to apply a timeout to the stats collection
        const statsPromise = adminDb.serverStatus();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Metrics collection timed out')), 5000);
        });
        
        const serverStats = await Promise.race([statsPromise, timeoutPromise]) as any;
        
        metrics.poolStats = {
          active: serverStats.connections.active,
          available: serverStats.connections.available,
          current: serverStats.connections.current,
          utilization: (serverStats.connections.current / serverStats.connections.available) * 100
        };

        metrics.operationStats = serverStats.opcounters;
        metrics.memory = serverStats.mem;

        // Check for slow operations
        const slowOps = await this.checkForSlowOperations(connection);
        if (slowOps.length > 0) {
          metrics.slowOperations = slowOps;
        }
      } catch (error) {
        this.logger.debug('[MongoDB] Could not collect advanced metrics:', error);
        
        // Fallback to basic connection status
        metrics.error = 'Could not collect advanced metrics';
      }
    }

    return metrics;
  }

  /**
   * Check for slow operations
   * 
   * @param connection - MongoDB connection
   * @returns Array of slow operations
   */
  private async checkForSlowOperations(connection: Connection): Promise<any[]> {
    try {
      if (!connection.db) {
        return [];
      }
      
      const adminDb = connection.db.admin();
      
      // Set a timeout for the slow operations check
      const opPromise = adminDb.command({ currentOp: 1, secs_running: { $gt: 1 } });
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Slow operations check timed out')), 5000);
      });
      
      const currentOp = await Promise.race([opPromise, timeoutPromise]) as any;
      
      if (currentOp && currentOp.inprog) {
        return currentOp.inprog
          .filter((op: any) => op.secs_running > monitoringConfig.alerts.queryPerformance.slowQueryThresholdMs / 1000)
          .map((op: any) => ({
            opid: op.opid,
            operation: op.op,
            namespace: op.ns,
            durationSeconds: op.secs_running,
            description: op.desc || op.query || 'Unknown operation'
          }));
      }
    } catch (error) {
      // Don't log this - it's fine if we don't have permission to check or it times out
    }
    
    return [];
  }

  /**
   * Get a MongoDB connection
   * 
   * @param options - Connection options (overrides constructor options)
   * @returns A promise resolving to a mongoose connection
   */
  async getConnection(options?: ConnectionOptions): Promise<Connection> {
    const opts = { ...this.options, ...options };
    
    // Check if we should use a mock connection
    if (this.shouldUseMockConnection(opts)) {
      this.logger.info('[MongoDB] Using mock connection for build/static generation');
      return createMockConnection();
    }
    
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
  private async getPooledConnection(options: ConnectionOptions = {}): Promise<Connection> {
    // If already connected, return existing connection
    if (cached.conn) {
      this.logger.debug('[MongoDB] Using cached connection');
      
      // Check if the connection is still active
      if (cached.conn.readyState !== 1) {
        this.logger.warn(`[MongoDB] Cached connection in ${this.getReadyStateDescription(cached.conn.readyState)} state, reconnecting...`);
        
        // Force reset the cache so we create a new connection
        cached.conn = null;
        cached.promise = null;
      } else {
        return cached.conn;
      }
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
        throw handleMongoError(error, 'Failed to establish pooled connection');
      });
    }

    try {
      // Wait for connection with a timeout
      const timeoutMs = options.timeoutMS || dbConfig.connectionTimeoutMS;
      
      const timeoutPromise = new Promise<Connection>((_, reject) => {
        setTimeout(() => {
          reject(new MongoDBError(
            'Timeout waiting for pooled connection',
            MongoDBErrorCode.CONNECTION_TIMEOUT
          ));
        }, timeoutMs);
      });
      
      // Race the cached promise against the timeout
      cached.conn = await Promise.race([cached.promise, timeoutPromise]);
      return cached.conn;
    } catch (error) {
      // Clear the promise on error so we can retry
      cached.promise = null;
      throw error;
    }
  }

  /**
   * Get human-readable description of connection ready state
   * 
   * @param readyState - Mongoose connection ready state number
   * @returns Human-readable description
   */
  private getReadyStateDescription(readyState: number): string {
    switch (readyState) {
      case 0: return 'disconnected';
      case 1: return 'connected';
      case 2: return 'connecting';
      case 3: return 'disconnecting';
      case 99: return 'uninitialized';
      default: return `unknown (${readyState})`;
    }
  }

  /**
   * Create a direct (non-pooled) MongoDB connection
   * 
   * @param options - Connection options
   * @returns A promise resolving to a mongoose connection
   */
  private async createDirectConnection(options: ConnectionOptions = {}): Promise<Connection> {
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
  ): Promise<Connection> {
    // Check if we should use a mock connection
    if (this.shouldUseMockConnection(options)) {
      this.logger.info('[MongoDB] Using mock connection for build/static generation');
      return createMockConnection();
    }

    // Generate a unique connection ID for tracking
    const connectionId = `${dbName}-${Date.now()}`;
    this.connectionStatus.set(connectionId, 'connecting');
    
    try {
      const connection = await this.connectWithRetry(connectionId, dbName, options);
      this.connectionStatus.set(connectionId, 'connected');
      return connection;
    } catch (error) {
      this.connectionStatus.set(connectionId, 'failed');
      throw error;
    }
  }

  /**
   * Connect to MongoDB with retry mechanism
   * 
   * @param connectionId - Unique ID for this connection attempt
   * @param dbName - Database name
   * @param options - Connection options
   * @param retryCount - Current retry count (internal)
   * @returns Promise resolving to a mongoose connection
   */
  private async connectWithRetry(
    connectionId: string,
    dbName: string,
    options: ConnectionOptions,
    retryCount = 0
  ): Promise<Connection> {
    try {
      // Get configurations
      const uri = dbConfig.uri;
      if (!uri) {
        throw new MongoDBError(
          'MONGODB_URI environment variable is not defined',
          MongoDBErrorCode.INVALID_URI
        );
      }

      // Normalize URI
      const normalizedUri = normalizeMongoURI(uri, dbName);
      
      // Log connection attempt (sanitized)
      const sanitizedUri = getSanitizedURI(normalizedUri);
      this.logger.debug(`[MongoDB] Connecting to: ${sanitizedUri} (${options.direct ? 'direct' : 'pooled'})`);

      // Prepare connection options
      const connectionOptions = this.getMongooseOptions(options);

      // Create a Mongoose instance for this connection (for direct connections)
      let mongooseInstance: mongoose.Mongoose | null = null;
      let connection: Connection;
      
      // Set timeout for connection attempt
      const timeoutMs = options.timeoutMS || dbConfig.connectionTimeoutMS;
      const connectionPromise = new Promise<Connection>(async (resolve, reject) => {
        try {
          if (options.direct) {
            // For direct connections, create a new Mongoose instance
            mongooseInstance = new mongoose.Mongoose();
            mongooseInstance.set('debug', mongoose.get('debug'));
            
            await mongooseInstance.connect(normalizedUri, connectionOptions);
            resolve(mongooseInstance.connection);
          } else {
            // For pooled connections, use the global mongoose instance
            await mongoose.connect(normalizedUri, connectionOptions);
            resolve(mongoose.connection);
          }
        } catch (error) {
          reject(error);
        }
      });
      
      // Create a timeout promise
      const timeoutPromise = new Promise<Connection>((_resolve, reject) => {
        setTimeout(() => {
          reject(new MongoDBError(
            `Connection attempt timed out after ${timeoutMs}ms`,
            MongoDBErrorCode.CONNECTION_TIMEOUT
          ));
        }, timeoutMs);
      });
      
      // Race the connection promise against the timeout
      connection = await Promise.race([connectionPromise, timeoutPromise]);
      
      this.logger.debug(`[MongoDB] Connected successfully to ${dbName}`);
      
      // Reset reconnect counter
      this.reconnectAttempts.set(connectionId, 0);
      
      // Set up event listeners
      this.setupConnectionListeners(connection, connectionId, options);

      return connection;
    } catch (error: any) {
      // Check if this is a timeout error
      const isTimeoutError = error.code === MongoDBErrorCode.CONNECTION_TIMEOUT || 
                          error.message?.includes('timed out') ||
                          error.message?.includes('timeout');
      
      // For timeout errors, increment timeout counter and retry differently
      if (isTimeoutError) {
        this.logger.warn(`[MongoDB] Connection attempt ${retryCount + 1} timed out`);
      }
      
      // Handle retry logic
      const maxRetries = options.maxReconnectAttempts ?? dbConfig.maxRetries;
      
      if (retryCount < maxRetries) {
        // Calculate delay with exponential backoff
        const delay = dbConfig.retryDelayMS * Math.pow(2, retryCount);
        this.logger.warn(`[MongoDB] Connection attempt ${retryCount + 1} failed. Retrying in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.connectWithRetry(connectionId, dbName, options, retryCount + 1);
      }

      // Max retries exceeded
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`[MongoDB] Failed to connect after ${maxRetries} attempts: ${errorMessage}`);
      
      // Throw standardized error
      throw handleMongoError(error, `Failed to connect to MongoDB (${dbName})`);
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
   * @param connectionId - Unique ID for this connection
   * @param options - Connection options
   */
  private setupConnectionListeners(
    connection: Connection, 
    connectionId: string,
    options: ConnectionOptions
  ): void {
    // Remove any existing listeners to prevent duplicates
    connection.removeAllListeners();
    
    // Add new listeners
    connection.on('disconnected', () => {
      this.logger.warn(`[MongoDB] Connection ${connectionId} disconnected`);
      this.connectionStatus.set(connectionId, 'disconnected');
      
      // Emit event
      this.emit('disconnected', connection);
      
      // Handle auto-reconnect if enabled
      if (options.autoReconnect !== false) {
        this.handleReconnect(connection, connectionId, options);
      }
    });

    connection.on('reconnected', () => {
      this.logger.info(`[MongoDB] Connection ${connectionId} reconnected successfully`);
      this.connectionStatus.set(connectionId, 'connected');
      
      // Reset reconnect counter
      this.reconnectAttempts.set(connectionId, 0);
      
      // Emit event
      this.emit('reconnected', connection);
    });

    connection.on('connected', () => {
      this.logger.info(`[MongoDB] Connection ${connectionId} established`);
      this.connectionStatus.set(connectionId, 'connected');
      
      // Emit event
      this.emit('connected', connection);
    });

    connection.on('error', (err) => {
      this.logger.error(`[MongoDB] Connection ${connectionId} error:`, err);
      this.connectionStatus.set(connectionId, 'error');
      
      // Emit event
      this.emit('error', err, connection);
    });

    connection.on('close', () => {
      this.logger.debug(`[MongoDB] Connection ${connectionId} closed`);
      this.connectionStatus.set(connectionId, 'closed');
      
      // Emit event
      this.emit('close', connection);
      
      // Remove from connections array
      this.connections = this.connections.filter(conn => conn !== connection);
    });

    // Setup monitoring in production or when explicitly enabled
    if (monitoringConfig.enabled) {
      this.setupMonitoring(connection, connectionId);
    }
  }

  /**
   * Handle reconnection logic
   * 
   * @param connection - Connection to reconnect
   * @param connectionId - Unique ID for this connection
   * @param options - Connection options
   */
  private handleReconnect(
    connection: Connection,
    connectionId: string,
    options: ConnectionOptions
  ): void {
    // Get current attempt count
    const currentAttempt = this.reconnectAttempts.get(connectionId) || 0;
    const maxAttempts = options.maxReconnectAttempts ?? dbConfig.maxRetries;
    
    // Check if we've reached max attempts
    if (currentAttempt >= maxAttempts) {
      this.logger.error(`[MongoDB] Connection ${connectionId} reached max reconnect attempts (${maxAttempts})`);
      this.connectionStatus.set(connectionId, 'failed');
      
      // Emit final error event
      const error = new MongoDBError(
        `Failed to reconnect after ${maxAttempts} attempts`,
        MongoDBErrorCode.CONNECTION_FAILED
      );
      
      this.emit('error', error, connection);
      return;
    }
    
    // Increment attempt counter
    this.reconnectAttempts.set(connectionId, currentAttempt + 1);
    
    // Calculate delay with exponential backoff
    const delay = dbConfig.retryDelayMS * Math.pow(2, currentAttempt);
    
    this.logger.info(`[MongoDB] Connection ${connectionId} attempting reconnect ${currentAttempt + 1}/${maxAttempts} in ${delay}ms`);
    
    // Mongoose will automatically attempt to reconnect
    // We're just tracking the attempts and handling max retries
  }

  /**
   * Set up monitoring for the connection
   * 
   * @param connection - Mongoose connection to monitor
   * @param connectionId - Unique ID for this connection
   */
  private setupMonitoring(connection: Connection, connectionId: string): void {
    const config = monitoringConfig;
    
    connection.on('commandStarted', (event) => {
      const monitoredCommands = ['find', 'insert', 'update', 'delete', 'aggregate'];
      if (monitoredCommands.includes(event.commandName)) {
        this.logger.debug(`[MongoDB] Connection ${connectionId}: Command ${event.commandName} started`, {
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
          this.logger.warn(`[MongoDB] Connection ${connectionId}: Slow ${event.commandName} detected (${latency}ms > ${threshold}ms)`, {
            command: event.commandName,
            duration: event.duration,
            threshold
          });
        }
      }
    });

    connection.on('commandFailed', (event) => {
      this.logger.error(`[MongoDB] Connection ${connectionId}: Command ${event.commandName} failed:`, event.failure);
    });
  }

  /**
   * Clean up all connections created by this factory
   */
  async cleanup(): Promise<void> {
    // Clean up metrics interval if it exists
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
    
    // Close all direct connections
    for (const connection of this.connections) {
      try {
        // Only disconnect if this is not the global cached connection
        if (connection !== cached.conn) {
          await connection.close();
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
   * Check health of connection
   * 
   * @param connection - Connection to check
   * @returns Health check result
   */
  async checkHealth(connection?: Connection): Promise<{
    status: 'healthy' | 'unhealthy';
    latency: number;
    details?: any;
  }> {
    // During build/static generation, return a mock healthy response
    if (isBuildTime || isStaticGeneration) {
      return {
        status: 'healthy',
        latency: 0,
        details: {
          readyState: 'connected',
          message: 'Mock connection for build/static generation'
        }
      };
    }

    const conn = connection || cached.conn || (this.connections[0] ?? null);
    
    if (!conn || conn.readyState !== 1) {
      return {
        status: 'unhealthy',
        latency: 0,
        details: {
          readyState: conn ? this.getReadyStateDescription(conn.readyState) : 'no connection',
          message: 'No active connection available'
        }
      };
    }
    
    const startTime = Date.now();
    
    try {
      // Verify db is available
      if (!conn.db) {
        throw new Error('Database connection not established');
      }
      
      // Add timeout to ping operation
      const pingPromise = conn.db.admin().ping();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Health check timed out')), 5000);
      });
      
      // Race the ping operation against the timeout
      await Promise.race([pingPromise, timeoutPromise]);
      
      const latency = Date.now() - startTime;
      
      return {
        status: 'healthy',
        latency,
        details: {
          readyState: this.getReadyStateDescription(conn.readyState),
          connectionId: conn.id
        }
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      
      return {
        status: 'unhealthy',
        latency,
        details: {
          readyState: this.getReadyStateDescription(conn.readyState),
          error: error instanceof Error ? error.message : String(error),
          connectionId: conn.id
        }
      };
    }
  }

  /**
   * Static method to disconnect all mongoose connections
   * Including the cached connection
   */
  static async disconnectAll(): Promise<void> {
    try {
      // During build, just clear the cache without trying to disconnect
      if (isBuildTime || isStaticGeneration) {
        cached.conn = null;
        cached.promise = null;
        console.debug('[MongoDB] Mock connection cleared (build mode)');
        return;
      }

      // Close the instance if it exists
      if (MongoConnectionManager.instance) {
        await MongoConnectionManager.instance.cleanup();
      }
      
      // Close global mongoose connection
      await mongoose.disconnect();
      
      // Reset cache
      cached.conn = null;
      cached.promise = null;
      
      console.debug('[MongoDB] All connections closed');
    } catch (error) {
      console.error('[MongoDB] Error disconnecting all connections:', error);
    }
  }
}

// Export the manager
export default MongoConnectionManager;