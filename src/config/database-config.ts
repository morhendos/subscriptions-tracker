/**
 * Unified MongoDB Database Configuration
 * 
 * Centralizes all database configuration values to ensure consistent
 * settings across the application. Values are loaded from environment
 * variables with sensible defaults for both development and production.
 */

import { ReadPreferenceMode } from 'mongodb';

// Supported write concern types
type WriteConcern = number | 'majority';
type MongoCompressor = 'none' | 'snappy' | 'zlib' | 'zstd';

/**
 * MongoDB Configuration Interface
 */
export interface MongoDBConfig {
  // Connection details
  uri: string;
  databaseName: string;
  
  // Connection pool settings
  maxPoolSize: number;
  minPoolSize: number;
  
  // Timeouts
  connectionTimeoutMS: number;
  serverSelectionTimeoutMS: number;
  socketTimeoutMS: number;
  maxIdleTimeMS: number;
  
  // Retry settings
  maxRetries: number;
  retryDelayMS: number;
  
  // Read/Write preferences
  writeConcern: WriteConcern;
  readPreference: ReadPreferenceMode;
  
  // Other settings
  autoIndex: boolean;
  autoCreate: boolean;
  ssl: boolean;
  authSource: string;
  retryWrites: boolean;
  retryReads: boolean;
  compressors?: MongoCompressor[];
  
  // Monitoring settings
  monitoring: {
    enabled: boolean;
    metricsIntervalSeconds: number;
    
    // Alerts
    alerts: {
      queryPerformance: {
        enabled: boolean;
        slowQueryThresholdMs: number;
        aggregationThresholdMs: number;
      };
      connectionPoolUtilization: {
        enabled: boolean;
        threshold: number;
        criticalThreshold: number;
      };
      replication: {
        enabled: boolean;
        maxLagSeconds: number;
      };
    };
    
    // Logging
    logging: {
      slowQueryThresholdMs: number;
      rotationDays: number;
      level: 'error' | 'warn' | 'info' | 'debug';
      mongoDBProfileLevel: 0 | 1 | 2;
    };
  };
  
  // Development-specific settings
  development: {
    logOperations: boolean;
  };
}

// Environment detection
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test';

// Build time detection
// Next.js sets this environment variable during build
export const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                         process.env.NEXT_PHASE === 'phase-export';

// Static generation detection (important for preventing DB connections during build)
export const isStaticGeneration = typeof process !== 'undefined' && 
                               process.env.NEXT_PHASE !== undefined;

/**
 * Default MongoDB configuration values for production environment
 * Optimized for cloud deployments like MongoDB Atlas
 */
const PRODUCTION_CONFIG: Partial<MongoDBConfig> = {
  // Connection pool
  maxPoolSize: 50,
  minPoolSize: 10,
  maxIdleTimeMS: 60000, // Increased from 30000 to 60000
  
  // Timeouts - Increased to handle potential slowdowns
  serverSelectionTimeoutMS: 15000, // Increased from 5000 to 15000
  socketTimeoutMS: 60000, // Increased from 45000 to 60000
  connectionTimeoutMS: 30000, // Increased from 10000 to 30000
  
  // Read/Write preferences
  writeConcern: 'majority',
  readPreference: 'primaryPreferred',
  
  // Other settings
  autoIndex: false,
  autoCreate: false,
  ssl: true,
  compressors: ['zlib', 'snappy'],
  
  // Monitoring
  monitoring: {
    enabled: true,
    metricsIntervalSeconds: 60,
    
    alerts: {
      queryPerformance: {
        enabled: true,
        slowQueryThresholdMs: 200, // Increased threshold to reduce noise
        aggregationThresholdMs: 2000, // Increased threshold
      },
      connectionPoolUtilization: {
        enabled: true,
        threshold: 80,
        criticalThreshold: 90,
      },
      replication: {
        enabled: true,
        maxLagSeconds: 10,
      },
    },
    
    logging: {
      slowQueryThresholdMs: 200, // Increased to match performance alert threshold
      rotationDays: 7,
      level: 'warn',
      mongoDBProfileLevel: 1,
    }
  },
  
  // Development settings
  development: {
    logOperations: false,
  }
};

/**
 * Default MongoDB configuration values for development environment
 * Optimized for local development
 */
const DEVELOPMENT_CONFIG: Partial<MongoDBConfig> = {
  // Connection pool
  maxPoolSize: 10,
  minPoolSize: 1,
  maxIdleTimeMS: 180000, // Increased from 120000 to 180000
  
  // Timeouts
  serverSelectionTimeoutMS: 30000, // Increased from 10000 to 30000
  socketTimeoutMS: 90000, // Increased from 60000 to 90000
  connectionTimeoutMS: 45000, // Increased from 20000 to 45000
  
  // Read/Write preferences
  writeConcern: 1,
  readPreference: 'primary',
  
  // Other settings
  autoIndex: true,
  autoCreate: true,
  ssl: false,
  compressors: ['zlib'],
  
  // Monitoring
  monitoring: {
    enabled: false,
    metricsIntervalSeconds: 60,
    
    alerts: {
      queryPerformance: {
        enabled: true,
        slowQueryThresholdMs: 300, // Increased threshold for development
        aggregationThresholdMs: 3000, // Increased threshold for development
      },
      connectionPoolUtilization: {
        enabled: false,
        threshold: 80,
        criticalThreshold: 90,
      },
      replication: {
        enabled: false,
        maxLagSeconds: 10,
      },
    },
    
    logging: {
      slowQueryThresholdMs: 300, // Increased to match performance alert threshold
      rotationDays: 1,
      level: 'debug',
      mongoDBProfileLevel: 1,
    }
  },
  
  // Development settings
  development: {
    logOperations: true,
  }
};

/**
 * Load MongoDB configuration with environment-specific values and
 * environment variable overrides.
 */
export function loadMongoDBConfig(): MongoDBConfig {
  // Start with environment-specific base config
  const baseConfig = isProduction ? PRODUCTION_CONFIG : DEVELOPMENT_CONFIG;
  
  // Create a config object first with the required properties that won't be in the base config
  const requiredConfig = {
    // URI - required
    uri: process.env.MONGODB_URI || '',
    databaseName: process.env.MONGODB_DATABASE || 'subscriptions',
    
    // These always get default settings if not specified elsewhere
    maxRetries: parseInt(process.env.MONGODB_MAX_RETRIES || '5'), // Increased from 3 to 5
    retryDelayMS: parseInt(process.env.MONGODB_RETRY_DELAY || '1000'),
    authSource: 'admin',
    retryWrites: true,
    retryReads: true,
  };

  // Create the full config by merging the required config with the base config
  // This avoids the property duplication TypeScript error
  const config: MongoDBConfig = {
    ...requiredConfig,
    ...baseConfig as MongoDBConfig,
  };

  // Disable SSL for local development connections to MongoDB
  if (isDevelopment && !isProduction) {
    config.ssl = false;
  }

  // Override with environment variables if provided
  if (process.env.MONGODB_MAX_POOL_SIZE) {
    config.maxPoolSize = parseInt(process.env.MONGODB_MAX_POOL_SIZE);
  }
  
  if (process.env.MONGODB_MIN_POOL_SIZE) {
    config.minPoolSize = parseInt(process.env.MONGODB_MIN_POOL_SIZE);
  }
  
  if (process.env.MONGODB_CONNECTION_TIMEOUT) {
    config.connectionTimeoutMS = parseInt(process.env.MONGODB_CONNECTION_TIMEOUT);
  }
  
  if (process.env.MONGODB_SERVER_SELECTION_TIMEOUT) {
    config.serverSelectionTimeoutMS = parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT);
  }
  
  if (process.env.MONGODB_SOCKET_TIMEOUT) {
    config.socketTimeoutMS = parseInt(process.env.MONGODB_SOCKET_TIMEOUT);
  }
  
  if (process.env.MONGODB_MAX_IDLE_TIME) {
    config.maxIdleTimeMS = parseInt(process.env.MONGODB_MAX_IDLE_TIME);
  }

  // SSL override
  if (process.env.MONGODB_SSL !== undefined) {
    config.ssl = process.env.MONGODB_SSL === 'true';
  }
  
  // Monitoring environment variables
  if (process.env.MONGODB_MONITORING_ENABLED) {
    config.monitoring.enabled = process.env.MONGODB_MONITORING_ENABLED === 'true';
  }
  
  if (process.env.MONGODB_METRICS_INTERVAL) {
    config.monitoring.metricsIntervalSeconds = parseInt(process.env.MONGODB_METRICS_INTERVAL);
  }
  
  if (process.env.MONGODB_SLOW_QUERY_THRESHOLD) {
    const threshold = parseInt(process.env.MONGODB_SLOW_QUERY_THRESHOLD);
    config.monitoring.alerts.queryPerformance.slowQueryThresholdMs = threshold;
    config.monitoring.logging.slowQueryThresholdMs = threshold;
  }
  
  if (process.env.MONGODB_AGGREGATION_THRESHOLD) {
    config.monitoring.alerts.queryPerformance.aggregationThresholdMs = 
      parseInt(process.env.MONGODB_AGGREGATION_THRESHOLD);
  }
  
  if (process.env.MONGODB_ALERT_POOL_THRESHOLD) {
    config.monitoring.alerts.connectionPoolUtilization.threshold = 
      parseInt(process.env.MONGODB_ALERT_POOL_THRESHOLD);
  }
  
  if (process.env.MONGODB_ALERT_POOL_CRITICAL) {
    config.monitoring.alerts.connectionPoolUtilization.criticalThreshold = 
      parseInt(process.env.MONGODB_ALERT_POOL_CRITICAL);
  }
  
  if (process.env.MONGODB_MAX_REPLICATION_LAG) {
    config.monitoring.alerts.replication.maxLagSeconds = 
      parseInt(process.env.MONGODB_MAX_REPLICATION_LAG);
  }
  
  if (process.env.MONGODB_LOG_LEVEL) {
    config.monitoring.logging.level = 
      process.env.MONGODB_LOG_LEVEL as 'error' | 'warn' | 'info' | 'debug';
  }
  
  if (process.env.MONGODB_LOG_OPERATIONS) {
    config.development.logOperations = process.env.MONGODB_LOG_OPERATIONS === 'true';
  }
  
  return config;
}

// Export the loaded configuration
export const mongodbConfig = loadMongoDBConfig();

// Default export for convenience
export default mongodbConfig;