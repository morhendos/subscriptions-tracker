import mongoose from 'mongoose';
import { getAtlasConfig, getMonitoringConfig } from './atlas-config';
import { validateMongoURI, getSanitizedURI } from '@/utils/mongodb-uri';
import { monitoring } from '../monitoring';
import { loadEnvVars, ensureEnvVars } from './env-debug';

// Load environment variables if they're not already available
if (!process.env.MONGODB_URI) {
  console.log('[MongoDB] MONGODB_URI not found in environment, attempting to load...');
  loadEnvVars();
  ensureEnvVars();
}

interface GlobalMongoose {
  conn: mongoose.Connection | null;
  promise: Promise<mongoose.Connection> | null;
}

declare global {
  var mongoose: GlobalMongoose | undefined;
}

// Constants for retry mechanism
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const isDev = process.env.NODE_ENV === 'development';

class MongoConnectionError extends Error {
  constructor(message: string, public readonly retryCount: number) {
    super(message);
    this.name = 'MongoConnectionError';
  }
}

// Initialize cached connection with strong typing
const cached: GlobalMongoose = global.mongoose ?? { conn: null, promise: null };
if (!global.mongoose) {
  global.mongoose = cached;
}

// Helper function to delay execution with exponential backoff
const delay = (retryCount: number) => 
  new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * Math.pow(2, retryCount)));

// Validate environment variables
const validateEnv = () => {
  // Double-check environment variables are loaded
  if (!process.env.MONGODB_URI) {
    console.error('[MongoDB] MONGODB_URI still not found after loading attempts');
    
    // In development mode, use a fallback value as a last resort
    if (isDev) {
      console.warn('[MongoDB] Using fallback connection string for development');
      process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/subscriptions';
    } else {
      throw new Error('MONGODB_URI environment variable is not defined');
    }
  }

  if (!validateMongoURI(process.env.MONGODB_URI)) {
    throw new Error('MONGODB_URI environment variable is invalid');
  }
};

// Parse and normalize MongoDB URI to ensure it has a valid database name
export function normalizeMongoURI(uri: string, dbName: string = 'subscriptions'): string {
  try {
    // Parse the URI to properly handle different URI formats
    const url = new URL(uri);
    
    // Extract the current path (which might contain a database name)
    let path = url.pathname;
    
    // Check if the path is just a slash or empty, or contains an invalid database name
    if (path === '/' || path === '' || path.includes('_/')) {
      // Replace the path with just the database name
      url.pathname = `/${dbName}`;
    } else {
      // If the path already has a database name (but not the one we want)
      // We extract everything before any query parameters and replace the db name
      
      // Remove any query parameters from consideration
      const pathWithoutQuery = path.split('?')[0];
      
      // Check if the path already has our desired database name
      if (pathWithoutQuery === `/${dbName}`) {
        // Nothing to do, correct database name is already in the path
      } else {
        // Replace whatever database name is there with our desired one
        url.pathname = `/${dbName}`;
      }
    }
    
    // Ensure we have the necessary query parameters
    const searchParams = new URLSearchParams(url.search);
    if (!searchParams.has('retryWrites')) {
      searchParams.set('retryWrites', 'true');
    }
    if (!searchParams.has('w')) {
      searchParams.set('w', 'majority');
    }
    
    // Update the search parameters
    url.search = searchParams.toString();
    
    // Return the properly formatted URI
    return url.toString();
  } catch (error) {
    // If URL parsing fails, fall back to a more basic string manipulation
    isDev && console.warn('Failed to parse MongoDB URI as URL, falling back to string manipulation');
    
    // Remove any existing database name and query parameters
    let baseUri = uri;
    
    // Check for presence of query parameters
    const queryIndex = baseUri.indexOf('?');
    if (queryIndex > -1) {
      baseUri = baseUri.substring(0, queryIndex);
    }
    
    // Ensure URI ends with a single slash
    if (!baseUri.endsWith('/')) {
      baseUri = `${baseUri}/`;
    }
    
    // Append database name and query parameters
    return `${baseUri}${dbName}?retryWrites=true&w=majority`;
  }
}

// Enhanced monitoring setup for Atlas
const setupMonitoring = (connection: mongoose.Connection) => {
  const config = getMonitoringConfig();
  const metricsInterval = config.metrics.intervalSeconds * 1000;
  
  if (config.metrics.enabled) {
    // Command monitoring with detailed performance tracking
    connection.on('commandStarted', (event) => {
      const monitoredCommands = ['find', 'insert', 'update', 'delete', 'aggregate'];
      if (monitoredCommands.includes(event.commandName)) {
        monitoring.info(`[MongoDB Atlas] Command ${event.commandName} started`, {
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
        monitoring.info(`[MongoDB Atlas] Command ${event.commandName} succeeded`, {
          duration: latency,
          timestamp: new Date().toISOString()
        });

        const threshold = event.commandName === 'aggregate' 
          ? config.alerts.queryPerformance.aggregationThresholdMs 
          : config.alerts.queryPerformance.slowQueryThresholdMs;

        if (latency > threshold) {
          monitoring.warn(`[MongoDB Atlas] Slow ${event.commandName} detected`, {
            duration: latency,
            threshold,
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    connection.on('commandFailed', (event) => {
      monitoring.error(`[MongoDB Atlas] Command ${event.commandName} failed`, {
        error: event.failure,
        timestamp: new Date().toISOString()
      });
    });
  }

  // Enhanced performance monitoring for Atlas
  if (config.alerts.queryPerformance.enabled) {
    const db = connection.db;
    
    if (db) {
      setInterval(async () => {
        try {
          const adminDb = db.admin();
          const [serverStatus, replSetStatus] = await Promise.all([
            adminDb.serverStatus(),
            adminDb.command({ replSetGetStatus: 1 }).catch(() => null)
          ]);

          const metrics = {
            connections: {
              current: serverStatus.connections.current,
              available: serverStatus.connections.available,
              utilizationPercentage: (serverStatus.connections.current / serverStatus.connections.available) * 100
            },
            opcounters: serverStatus.opcounters,
            network: serverStatus.network,
            memory: serverStatus.mem,
            replication: replSetStatus ? {
              lag: replSetStatus.members.filter((m: any) => !m.self).map((m: any) => m.optimeDate),
              status: replSetStatus.members.map((m: any) => ({ 
                name: m.name,
                state: m.stateStr,
                health: m.health 
              }))
            } : null
          };

          // Check thresholds and alert if necessary
          if (metrics.connections.utilizationPercentage > config.alerts.connectionPoolUtilization.threshold) {
            monitoring.warn('[MongoDB Atlas] High connection pool utilization', {
              utilization: metrics.connections.utilizationPercentage,
              threshold: config.alerts.connectionPoolUtilization.threshold,
              timestamp: new Date().toISOString()
            });
          }

          if (replSetStatus && config.alerts.replication.enabled) {
            const maxLag = Math.max(...metrics.replication!.lag);
            if (maxLag > config.alerts.replication.maxLagSeconds * 1000) {
              monitoring.warn('[MongoDB Atlas] High replication lag detected', {
                lag: maxLag,
                threshold: config.alerts.replication.maxLagSeconds * 1000,
                timestamp: new Date().toISOString()
              });
            }
          }

          // Store metrics for health checks
          (global as any).mongoMetrics = metrics;
        } catch (error) {
          monitoring.error('[MongoDB Atlas] Failed to collect metrics', { error });
        }
      }, metricsInterval);
    }
  }
};

// Connect to MongoDB with retry mechanism
async function connectWithRetry(retryCount = 0): Promise<mongoose.Connection> {
  try {
    validateEnv();

    const uri = process.env.MONGODB_URI as string;
    const dbName = process.env.MONGODB_DATABASE || 'subscriptions';
    
    // Normalize the URI to ensure it has a valid database name
    const normalizedUri = normalizeMongoURI(uri, dbName);
    
    isDev && monitoring.info('[MongoDB Atlas] Connecting to:', { 
      uri: getSanitizedURI(normalizedUri),
      database: dbName 
    });

    const atlasConfig = getAtlasConfig(process.env.NODE_ENV);
    const connection = await mongoose.connect(normalizedUri, atlasConfig);
    isDev && monitoring.info('[MongoDB Atlas] Connected successfully');

    // Set up connection monitoring
    connection.connection.on('disconnected', () => {
      monitoring.warn('[MongoDB Atlas] Disconnected. Attempting to reconnect...');
    });

    connection.connection.on('reconnected', () => {
      monitoring.info('[MongoDB Atlas] Reconnected successfully');
    });

    connection.connection.on('error', (err) => {
      monitoring.error('[MongoDB Atlas] Connection error:', { error: err });
    });

    // Setup monitoring in production or when explicitly enabled
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_MONITORING === 'true') {
      setupMonitoring(connection.connection);
    }

    return connection.connection;
  } catch (error: any) {
    if (retryCount < MAX_RETRIES) {
      monitoring.warn(`[MongoDB Atlas] Connection attempt ${retryCount + 1} failed. Retrying...`, {
        error: error.message,
        retryCount,
        nextRetryIn: RETRY_DELAY_MS * Math.pow(2, retryCount)
      });
      
      await delay(retryCount);
      return connectWithRetry(retryCount + 1);
    }

    throw new MongoConnectionError(
      `Failed to connect to MongoDB Atlas after ${MAX_RETRIES} attempts: ${error.message}`,
      retryCount
    );
  }
}

// Main connection function
export async function connectToDatabase(): Promise<mongoose.Connection> {
  if (cached.conn) {
    isDev && monitoring.info('[MongoDB Atlas] Using cached connection');
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = connectWithRetry()
      .catch((error) => {
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error: any) {
    cached.promise = null;
    throw error;
  }
}

// Disconnect function with proper cleanup
export async function disconnectFromDatabase(): Promise<void> {
  if (cached.conn) {
    try {
      await mongoose.disconnect();
      cached.conn = null;
      cached.promise = null;
      isDev && monitoring.info('[MongoDB Atlas] Disconnected successfully');
      // Clear stored metrics
      (global as any).mongoMetrics = null;
    } catch (error: any) {
      monitoring.error('[MongoDB Atlas] Disconnect error:', { error: error.message });
      throw error;
    }
  }
}

// Enhanced health check function with Atlas metrics
export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  latency: number;
  metrics?: {
    connections: {
      current: number;
      available: number;
      utilizationPercentage: number;
    };
    opcounters?: {
      insert: number;
      query: number;
      update: number;
      delete: number;
      getmore: number;
      command: number;
    };
    replication?: {
      status: Array<{
        name: string;
        state: string;
        health: number;
      }>;
      maxLagMs?: number;
    };
  };
  message?: string;
  timestamp: string;
}> {
  const startTime = Date.now();
  
  try {
    const conn = mongoose.connection;
    
    if (!conn.db) {
      throw new Error('Database connection not established');
    }

    const adminDb = conn.db.admin();
    
    // Execute checks in parallel
    const [ping, serverStatus, replSetStatus] = await Promise.all([
      adminDb.ping(),
      adminDb.serverStatus(),
      adminDb.command({ replSetGetStatus: 1 }).catch(() => null)
    ]);

    if (!ping.ok) {
      throw new Error('Database ping failed');
    }

    const latency = Date.now() - startTime;
    const cachedMetrics = (global as any).mongoMetrics;

    const response = {
      status: 'healthy' as const,
      latency,
      timestamp: new Date().toISOString(),
      metrics: {
        connections: {
          current: serverStatus.connections.current,
          available: serverStatus.connections.available,
          utilizationPercentage: (serverStatus.connections.current / serverStatus.connections.available) * 100
        },
        opcounters: serverStatus.opcounters,
        ...cachedMetrics
      },
      message: 'Database is responding normally'
    };

    // Add replication metrics if available
    if (replSetStatus) {
      const replicationMetrics = {
        status: replSetStatus.members.map((m: any) => ({
          name: m.name,
          state: m.stateStr,
          health: m.health
        })),
        maxLagMs: Math.max(...replSetStatus.members
          .filter((m: any) => !m.self)
          .map((m: any) => m.optimeDate)
        )
      };

      response.metrics.replication = replicationMetrics;
    }

    return response;
  } catch (error: any) {
    const errorResponse = {
      status: 'unhealthy' as const,
      latency: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      message: `Database health check failed: ${error.message}`
    };

    monitoring.error('[MongoDB Atlas] Health check failed', {
      error: error.message,
      latency: errorResponse.latency
    });

    return errorResponse;
  }
}