import mongoose from 'mongoose';
import { getAtlasConfig, getMonitoringConfig } from './atlas-config';
import { validateMongoURI, getSanitizedURI } from './config';

declare global {
  var mongoose: {
    conn: mongoose.Connection | null;
    promise: Promise<mongoose.Connection> | null;
  } | undefined;
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

// Initialize cached connection
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
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

// Setup monitoring if enabled
const setupMonitoring = (connection: mongoose.Connection) => {
  const config = getMonitoringConfig();
  
  if (config.metrics.enabled) {
    // Setup command monitoring
    connection.on('commandStarted', (event) => {
      if (event.commandName === 'find' || event.commandName === 'insert' || 
          event.commandName === 'update' || event.commandName === 'delete') {
        console.debug(`[MongoDB] Command ${event.commandName} started`);
      }
    });

    connection.on('commandSucceeded', (event) => {
      if (event.commandName === 'find' || event.commandName === 'insert' || 
          event.commandName === 'update' || event.commandName === 'delete') {
        console.debug(`[MongoDB] Command ${event.commandName} succeeded (${event.duration}ms)`);

        // Check for slow queries
        if (event.duration > config.logging.slowQueryThresholdMs) {
          console.warn(`[MongoDB] Slow query detected: ${event.commandName} (${event.duration}ms)`);
        }
      }
    });

    connection.on('commandFailed', (event) => {
      console.error(`[MongoDB] Command ${event.commandName} failed:`, event.failure);
    });
  }

  // Setup performance monitoring
  if (config.alerts.queryPerformance.enabled) {
    const slowQueryThreshold = config.alerts.queryPerformance.slowQueryThresholdMs;
    
    connection.on('commandSucceeded', (event) => {
      if (event.duration > slowQueryThreshold) {
        console.warn(`[MongoDB] Performance alert: Slow query detected (${event.duration}ms)`);
        // Here you would typically send this to your monitoring service
      }
    });
  }

  // Setup connection pool monitoring
  if (config.alerts.connectionPoolUtilization.enabled) {
    const poolThreshold = config.alerts.connectionPoolUtilization.threshold;
    const maxPoolSize = connection.client.options.maxPoolSize || 100;
    
    setInterval(() => {
      const activeConnections = connection.client.connections.length;
      const utilizationPercentage = (activeConnections / maxPoolSize) * 100;
      
      if (utilizationPercentage > poolThreshold) {
        console.warn(`[MongoDB] Connection pool utilization high: ${utilizationPercentage.toFixed(2)}%`);
        // Here you would typically send this to your monitoring service
      }
    }, config.metrics.intervalSeconds * 1000);
  }
};

// Connect to MongoDB with retry mechanism
async function connectWithRetry(retryCount = 0): Promise<mongoose.Connection> {
  try {
    validateEnv();

    const uri = process.env.MONGODB_URI as string;
    isDev && console.log('[MongoDB] Connecting to:', getSanitizedURI(uri));

    const atlasConfig = getAtlasConfig(process.env.NODE_ENV);
    const connection = await mongoose.connect(uri, atlasConfig);
    isDev && console.log('[MongoDB] Connected successfully');

    // Set up connection monitoring
    connection.connection.on('disconnected', () => {
      console.warn('[MongoDB] Disconnected. Attempting to reconnect...');
    });

    connection.connection.on('reconnected', () => {
      console.log('[MongoDB] Reconnected successfully');
    });

    connection.connection.on('error', (err) => {
      console.error('[MongoDB] Connection error:', err);
    });

    // Setup monitoring if in production or explicitly enabled
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_MONITORING === 'true') {
      setupMonitoring(connection.connection);
    }

    return connection.connection;
  } catch (error: any) {
    if (retryCount < MAX_RETRIES) {
      console.warn(`[MongoDB] Connection attempt ${retryCount + 1} failed. Retrying in ${RETRY_DELAY_MS * Math.pow(2, retryCount)}ms...`);
      console.error('[MongoDB] Error:', error.message);
      
      await delay(retryCount);
      return connectWithRetry(retryCount + 1);
    }

    throw new MongoConnectionError(
      `Failed to connect to MongoDB after ${MAX_RETRIES} attempts: ${error.message}`,
      retryCount
    );
  }
}

// Main connection function
export async function connectToDatabase(): Promise<mongoose.Connection> {
  if (cached.conn) {
    isDev && console.log('[MongoDB] Using cached connection');
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
      isDev && console.log('[MongoDB] Disconnected successfully');
    } catch (error: any) {
      console.error('[MongoDB] Disconnect error:', error.message);
      throw error;
    }
  }
}

// Health check function with enhanced metrics
export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  latency: number;
  metrics?: {
    connections: number;
    poolSize: number;
    utilizationPercentage: number;
  };
  message?: string;
}> {
  try {
    const startTime = Date.now();
    const adminDb = mongoose.connection.db.admin();
    await adminDb.ping();
    const latency = Date.now() - startTime;

    // Get connection metrics if available
    const metrics = mongoose.connection.client ? {
      connections: mongoose.connection.client.connections.length,
      poolSize: mongoose.connection.client.options.maxPoolSize || 100,
      utilizationPercentage: (mongoose.connection.client.connections.length / 
        (mongoose.connection.client.options.maxPoolSize || 100)) * 100
    } : undefined;

    return {
      status: 'healthy',
      latency,
      metrics,
      message: 'Database is responding normally'
    };
  } catch (error: any) {
    return {
      status: 'unhealthy',
      latency: -1,
      message: `Database health check failed: ${error.message}`
    };
  }
}