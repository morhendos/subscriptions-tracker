import mongoose from 'mongoose';
import { getAtlasConfig, getMonitoringConfig } from './atlas-config';
import { validateMongoURI, getSanitizedURI } from './config';

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
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not defined');
  }

  if (!validateMongoURI(process.env.MONGODB_URI)) {
    throw new Error('MONGODB_URI environment variable is invalid');
  }
};

// Enhanced monitoring setup for Atlas
const setupMonitoring = (connection: mongoose.Connection) => {
  const config = getMonitoringConfig();
  const metricsInterval = config.metrics.intervalSeconds * 1000;
  
  if (config.metrics.enabled) {
    // Command monitoring with detailed performance tracking
    connection.on('commandStarted', (event) => {
      const monitoredCommands = ['find', 'insert', 'update', 'delete', 'aggregate'];
      if (monitoredCommands.includes(event.commandName)) {
        console.debug(`[MongoDB Atlas] Command ${event.commandName} started`, {
          namespace: event.databaseName,
          commandName: event.commandName,
          timestamp: new Date().toISOString()
        });
      }
    });

    connection.on('commandSucceeded', (event) => {
      const monitoredCommands = ['find', 'insert', 'update', 'delete', 'aggregate'];
      if (monitoredCommands.includes(event.commandName)) {
        // Track command latency
        const latency = event.duration;
        console.debug(`[MongoDB Atlas] Command ${event.commandName} succeeded`, {
          duration: latency,
          timestamp: new Date().toISOString()
        });

        // Check against different thresholds based on command type
        const threshold = event.commandName === 'aggregate' 
          ? config.alerts.queryPerformance.aggregationThresholdMs 
          : config.alerts.queryPerformance.slowQueryThresholdMs;

        if (latency > threshold) {
          console.warn(`[MongoDB Atlas] Slow ${event.commandName} detected`, {
            duration: latency,
            threshold,
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    connection.on('commandFailed', (event) => {
      console.error(`[MongoDB Atlas] Command ${event.commandName} failed:`, {
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
            adminDb.command({ replSetGetStatus: 1 }).catch(() => null) // Might fail in standalone
          ]);

          // Track comprehensive metrics
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

          // Check against thresholds
          if (metrics.connections.utilizationPercentage > config.alerts.connectionPoolUtilization.threshold) {
            console.warn('[MongoDB Atlas] High connection pool utilization', {
              utilization: metrics.connections.utilizationPercentage,
              threshold: config.alerts.connectionPoolUtilization.threshold,
              timestamp: new Date().toISOString()
            });
          }

          if (replSetStatus && config.alerts.replication.enabled) {
            const maxLag = Math.max(...metrics.replication!.lag);
            if (maxLag > config.alerts.replication.maxLagSeconds * 1000) {
              console.warn('[MongoDB Atlas] High replication lag detected', {
                lag: maxLag,
                threshold: config.alerts.replication.maxLagSeconds * 1000,
                timestamp: new Date().toISOString()
              });
            }
          }

          // Store metrics for health checks
          (global as any).mongoMetrics = metrics;
        } catch (error) {
          console.error('[MongoDB Atlas] Failed to collect metrics:', error);
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
    isDev && console.log('[MongoDB Atlas] Connecting to:', getSanitizedURI(uri));

    const atlasConfig = getAtlasConfig(process.env.NODE_ENV);
    const connection = await mongoose.connect(uri, atlasConfig);
    isDev && console.log('[MongoDB Atlas] Connected successfully');

    // Enhanced connection monitoring
    connection.connection.on('disconnected', () => {
      console.warn('[MongoDB Atlas] Disconnected. Attempting to reconnect...');
    });

    connection.connection.on('reconnected', () => {
      console.log('[MongoDB Atlas] Reconnected successfully');
    });

    connection.connection.on('error', (err) => {
      console.error('[MongoDB Atlas] Connection error:', err);
    });

    // Setup Atlas monitoring in production or when explicitly enabled
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_MONITORING === 'true') {
      setupMonitoring(connection.connection);
    }

    return connection.connection;
  } catch (error: any) {
    if (retryCount < MAX_RETRIES) {
      console.warn(`[MongoDB Atlas] Connection attempt ${retryCount + 1} failed. Retrying in ${RETRY_DELAY_MS * Math.pow(2, retryCount)}ms...`);
      console.error('[MongoDB Atlas] Error:', error.message);
      
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
    isDev && console.log('[MongoDB Atlas] Using cached connection');
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
      isDev && console.log('[MongoDB Atlas] Disconnected successfully');
      // Clear stored metrics
      (global as any).mongoMetrics = null;
    } catch (error: any) {
      console.error('[MongoDB Atlas] Disconnect error:', error.message);
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

    // Calculate latency
    const latency = Date.now() - startTime;

    // Get cached metrics if available
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
        ...cachedMetrics  // Include additional cached metrics if available
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
    return {
      status: 'unhealthy',
      latency: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      message: `Database health check failed: ${error.message}`
    };
  }
}