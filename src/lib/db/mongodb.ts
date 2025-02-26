/**
 * MongoDB Connection Module
 * 
 * Provides core functionality for connecting to MongoDB, with connection
 * pooling, retry mechanisms, and monitoring.
 */
import mongoose from 'mongoose';
import { getAtlasConfig, getMonitoringConfig } from './atlas-config';
import { normalizeMongoURI, getSanitizedURI, validateMongoURI } from '@/utils/mongodb-uri';
import { monitoring } from '../monitoring';
import { mongodbConfig, isDevelopment } from '@/config/database-config';

interface GlobalMongoose {
  conn: mongoose.Connection | null;
  promise: Promise<mongoose.Connection> | null;
}

declare global {
  var mongoose: GlobalMongoose | undefined;
}

// Constants for retry mechanism
const MAX_RETRIES = mongodbConfig.maxRetries;
const RETRY_DELAY_MS = mongodbConfig.retryDelayMS;

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
  if (!mongodbConfig.uri) {
    throw new Error('MONGODB_URI environment variable is not defined');
  }

  if (!validateMongoURI(mongodbConfig.uri)) {
    throw new Error('MONGODB_URI environment variable is invalid');
  }
};

// Connect to MongoDB with retry mechanism
async function connectWithRetry(retryCount = 0): Promise<mongoose.Connection> {
  try {
    validateEnv();

    const uri = mongodbConfig.uri;
    const dbName = mongodbConfig.databaseName;
    
    // Normalize the URI to ensure it has a valid database name
    const normalizedUri = normalizeMongoURI(uri, dbName);
    
    isDevelopment && monitoring.info('[MongoDB] Connecting to:', { 
      uri: getSanitizedURI(normalizedUri),
      database: dbName 
    });

    const atlasConfig = getAtlasConfig(process.env.NODE_ENV);
    const connection = await mongoose.connect(normalizedUri, atlasConfig);
    isDevelopment && monitoring.info('[MongoDB] Connected successfully');

    // Set up connection monitoring
    connection.connection.on('disconnected', () => {
      monitoring.warn('[MongoDB] Disconnected. Attempting to reconnect...');
    });

    connection.connection.on('reconnected', () => {
      monitoring.info('[MongoDB] Reconnected successfully');
    });

    connection.connection.on('error', (err) => {
      monitoring.error('[MongoDB] Connection error:', { error: err });
    });

    // Setup monitoring in production or when explicitly enabled
    if (mongodbConfig.monitoring.enabled) {
      setupMonitoring(connection.connection);
    }

    return connection.connection;
  } catch (error: any) {
    if (retryCount < MAX_RETRIES) {
      monitoring.warn(`[MongoDB] Connection attempt ${retryCount + 1} failed. Retrying...`, {
        error: error.message,
        retryCount,
        nextRetryIn: RETRY_DELAY_MS * Math.pow(2, retryCount)
      });
      
      await delay(retryCount);
      return connectWithRetry(retryCount + 1);
    }

    throw new MongoConnectionError(
      `Failed to connect to MongoDB after ${MAX_RETRIES} attempts: ${error.message}`,
      retryCount
    );
  }
}

// Enhanced monitoring setup
function setupMonitoring(connection: mongoose.Connection) {
  const config = getMonitoringConfig();
  const metricsInterval = config.metrics.intervalSeconds * 1000;
  
  if (config.metrics.enabled) {
    // Command monitoring with detailed performance tracking
    connection.on('commandStarted', (event) => {
      const monitoredCommands = ['find', 'insert', 'update', 'delete', 'aggregate'];
      if (monitoredCommands.includes(event.commandName)) {
        monitoring.info(`[MongoDB] Command ${event.commandName} started`, {
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
        monitoring.info(`[MongoDB] Command ${event.commandName} succeeded`, {
          duration: latency,
          timestamp: new Date().toISOString()
        });

        const threshold = event.commandName === 'aggregate' 
          ? config.alerts.queryPerformance.aggregationThresholdMs 
          : config.alerts.queryPerformance.slowQueryThresholdMs;

        if (latency > threshold) {
          monitoring.warn(`[MongoDB] Slow ${event.commandName} detected`, {
            duration: latency,
            threshold,
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    connection.on('commandFailed', (event) => {
      monitoring.error(`[MongoDB] Command ${event.commandName} failed`, {
        error: event.failure,
        timestamp: new Date().toISOString()
      });
    });
  }

  // Enhanced performance monitoring
  if (mongodbConfig.monitoring.alerts.queryPerformance.enabled) {
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
          if (metrics.connections.utilizationPercentage > mongodbConfig.monitoring.alerts.connectionPoolUtilization.threshold) {
            monitoring.warn('[MongoDB] High connection pool utilization', {
              utilization: metrics.connections.utilizationPercentage,
              threshold: mongodbConfig.monitoring.alerts.connectionPoolUtilization.threshold,
              timestamp: new Date().toISOString()
            });
          }

          if (replSetStatus && mongodbConfig.monitoring.alerts.replication.enabled) {
            const maxLag = Math.max(...metrics.replication!.lag);
            if (maxLag > mongodbConfig.monitoring.alerts.replication.maxLagSeconds * 1000) {
              monitoring.warn('[MongoDB] High replication lag detected', {
                lag: maxLag,
                threshold: mongodbConfig.monitoring.alerts.replication.maxLagSeconds * 1000,
                timestamp: new Date().toISOString()
              });
            }
          }

          // Store metrics for health checks
          (global as any).mongoMetrics = metrics;
        } catch (error) {
          monitoring.error('[MongoDB] Failed to collect metrics', { error });
        }
      }, metricsInterval);
    }
  }
}

// Main connection function
export async function connectToDatabase(): Promise<mongoose.Connection> {
  if (cached.conn) {
    isDevelopment && monitoring.info('[MongoDB] Using cached connection');
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
      isDevelopment && monitoring.info('[MongoDB] Disconnected successfully');
      // Clear stored metrics
      (global as any).mongoMetrics = null;
    } catch (error: any) {
      monitoring.error('[MongoDB] Disconnect error:', { error: error.message });
      throw error;
    }
  }
}

// Enhanced health check function with metrics
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

    monitoring.error('[MongoDB] Health check failed', {
      error: error.message,
      latency: errorResponse.latency
    });

    return errorResponse;
  }
}
