/**
 * MongoDB Database Configuration
 * 
 * Centralizes all database configuration values to ensure consistent
 * settings across the application. Values are loaded from environment
 * variables with sensible defaults.
 */

import { ReadPreferenceMode } from 'mongodb';

// Supported write concern types
type WriteConcern = number | 'majority';

// Environment detection
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test';

/**
 * Core database configuration
 */
export const dbConfig = {
  // Connection string - required
  uri: process.env.MONGODB_URI || '',
  
  // Database name - used for normalizing URIs
  databaseName: process.env.MONGODB_DATABASE || 'subscriptions',
  
  // Connection pool settings
  maxPoolSize: isProduction ? 50 : 10,
  minPoolSize: isProduction ? 10 : 1,
  
  // Timeouts
  connectionTimeoutMS: parseInt(process.env.MONGODB_CONNECTION_TIMEOUT || '10000'),
  serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT || '5000'),
  socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT || '30000'),
  maxIdleTimeMS: parseInt(process.env.MONGODB_MAX_IDLE_TIME || '120000'),
  
  // Retry settings
  maxRetries: parseInt(process.env.MONGODB_MAX_RETRIES || '3'),
  retryDelayMS: parseInt(process.env.MONGODB_RETRY_DELAY || '1000'),
  
  // Read/Write preferences
  writeConcern: (isProduction ? 'majority' : 1) as WriteConcern,
  readPreference: (isProduction ? 'primaryPreferred' : 'primary') as ReadPreferenceMode,
  
  // Auto-indexing (enabled in development, disabled in production)
  autoIndex: !isProduction,
  
  // SSL Settings
  ssl: isProduction,
  
  // Authentication
  authSource: 'admin',
  
  // Other settings
  retryWrites: true,
  retryReads: true,
  
  // Log database operations in development
  logOperations: isDevelopment && (process.env.MONGODB_LOG_OPERATIONS === 'true'),
};

/**
 * Monitoring configuration
 */
export const monitoringConfig = {
  enabled: process.env.MONGODB_MONITORING_ENABLED === 'true' || isProduction,
  
  // Metrics
  metricsInterval: parseInt(process.env.MONGODB_METRICS_INTERVAL || '60'),
  customMetrics: [
    'atlas.numberOfConnections',
    'atlas.opcounters',
    'atlas.memory',
    'atlas.network',
  ],
  
  // Alerts
  alerts: {
    queryPerformance: {
      enabled: true,
      slowQueryThresholdMs: parseInt(process.env.MONGODB_SLOW_QUERY_THRESHOLD || '100'),
      aggregationThresholdMs: parseInt(process.env.MONGODB_AGGREGATION_THRESHOLD || '1000'),
    },
    connectionPool: {
      enabled: true,
      threshold: parseInt(process.env.MONGODB_ALERT_POOL_THRESHOLD || '80'),
      criticalThreshold: parseInt(process.env.MONGODB_ALERT_POOL_CRITICAL || '90'),
    },
    replication: {
      enabled: true,
      maxLagSeconds: parseInt(process.env.MONGODB_MAX_REPLICATION_LAG || '10'),
    },
  },
  
  // Logging
  logging: {
    slowQueryThresholdMs: parseInt(process.env.MONGODB_SLOW_QUERY_THRESHOLD || '100'),
    rotationDays: parseInt(process.env.MONGODB_LOG_ROTATION_DAYS || '7'),
    level: (process.env.MONGODB_LOG_LEVEL || 'info') as 'error' | 'warn' | 'info' | 'debug',
    mongoDBProfileLevel: parseInt(process.env.MONGODB_PROFILE_LEVEL || '1') as 0 | 1 | 2,
  },
};

// Export all configurations together for convenience
export default {
  dbConfig,
  monitoringConfig,
  isDevelopment,
  isProduction,
  isTest,
};