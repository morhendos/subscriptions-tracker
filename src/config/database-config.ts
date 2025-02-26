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

/**
 * Default MongoDB configuration values for production environment
 * Optimized for cloud deployments like MongoDB Atlas
 */
const PRODUCTION_CONFIG: Partial<MongoDBConfig> = {
  // Connection pool
  maxPoolSize: 50,
  minPoolSize: 10,
  maxIdleTimeMS: 30000,
  
  // Timeouts
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectionTimeoutMS: 10000,
  
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
        slowQueryThresholdMs: 100,
        aggregationThresholdMs: 1000,
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
      slowQueryThresholdMs: 100,
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
  maxIdleTimeMS: 120000,
  
  // Timeouts
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 60000,
  connectionTimeoutMS: 20000,
  
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
        slowQueryThresholdMs: 200,
        aggregationThresholdMs: 2000,
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
      slowQueryThresholdMs: 200,
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
    maxRetries: parseInt(process.env.MONGODB_MAX_RETRIES || '3'),
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
