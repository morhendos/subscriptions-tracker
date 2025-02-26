/**
 * MongoDB Database Configuration
 * 
 * This is a wrapper module that exports the unified database configuration
 * for backward compatibility with existing code.
 */

import mongodbConfig, { 
  isDevelopment, 
  isProduction, 
  isTest, 
  MongoDBConfig 
} from './database-config';

// Re-export environment detection helpers
export { isDevelopment, isProduction, isTest };

// Export the core database configuration
export const dbConfig = {
  // Connection string
  uri: mongodbConfig.uri,
  
  // Database name
  databaseName: mongodbConfig.databaseName,
  
  // Connection pool settings
  maxPoolSize: mongodbConfig.maxPoolSize,
  minPoolSize: mongodbConfig.minPoolSize,
  
  // Timeouts
  connectionTimeoutMS: mongodbConfig.connectionTimeoutMS,
  serverSelectionTimeoutMS: mongodbConfig.serverSelectionTimeoutMS,
  socketTimeoutMS: mongodbConfig.socketTimeoutMS,
  maxIdleTimeMS: mongodbConfig.maxIdleTimeMS,
  
  // Retry settings
  maxRetries: mongodbConfig.maxRetries,
  retryDelayMS: mongodbConfig.retryDelayMS,
  
  // Read/Write preferences
  writeConcern: mongodbConfig.writeConcern,
  readPreference: mongodbConfig.readPreference,
  
  // Other settings
  autoIndex: mongodbConfig.autoIndex,
  ssl: mongodbConfig.ssl,
  authSource: mongodbConfig.authSource,
  retryWrites: mongodbConfig.retryWrites,
  retryReads: mongodbConfig.retryReads,
  
  // Development options
  logOperations: mongodbConfig.development.logOperations,
};

// Export monitoring configuration
export const monitoringConfig = {
  enabled: mongodbConfig.monitoring.enabled,
  
  // Metrics
  metricsInterval: mongodbConfig.monitoring.metricsIntervalSeconds,
  customMetrics: [
    'atlas.numberOfConnections',
    'atlas.opcounters',
    'atlas.memory',
    'atlas.network',
  ],
  
  // Alerts
  alerts: {
    queryPerformance: {
      enabled: mongodbConfig.monitoring.alerts.queryPerformance.enabled,
      slowQueryThresholdMs: mongodbConfig.monitoring.alerts.queryPerformance.slowQueryThresholdMs,
      aggregationThresholdMs: mongodbConfig.monitoring.alerts.queryPerformance.aggregationThresholdMs,
    },
    connectionPool: {
      enabled: mongodbConfig.monitoring.alerts.connectionPoolUtilization.enabled,
      threshold: mongodbConfig.monitoring.alerts.connectionPoolUtilization.threshold,
      criticalThreshold: mongodbConfig.monitoring.alerts.connectionPoolUtilization.criticalThreshold,
    },
    replication: {
      enabled: mongodbConfig.monitoring.alerts.replication.enabled,
      maxLagSeconds: mongodbConfig.monitoring.alerts.replication.maxLagSeconds,
    },
  },
  
  // Logging
  logging: {
    slowQueryThresholdMs: mongodbConfig.monitoring.logging.slowQueryThresholdMs,
    rotationDays: mongodbConfig.monitoring.logging.rotationDays,
    level: mongodbConfig.monitoring.logging.level,
    mongoDBProfileLevel: mongodbConfig.monitoring.logging.mongoDBProfileLevel,
  },
};

// Export mongoose connection options generator for backward compatibility
export const getMongooseOptions = () => {
  return {
    // Connection pool settings
    maxPoolSize: dbConfig.maxPoolSize,
    minPoolSize: dbConfig.minPoolSize,
    
    // Timeouts
    serverSelectionTimeoutMS: dbConfig.serverSelectionTimeoutMS,
    socketTimeoutMS: dbConfig.socketTimeoutMS,
    connectTimeoutMS: dbConfig.connectionTimeoutMS,
    maxIdleTimeMS: dbConfig.maxIdleTimeMS,
    
    // Read/write preferences
    writeConcern: {
      w: dbConfig.writeConcern,
      j: isProduction,
    },
    
    // Other settings
    autoIndex: dbConfig.autoIndex,
    retryWrites: dbConfig.retryWrites,
    retryReads: dbConfig.retryReads,
    ssl: dbConfig.ssl,
    authSource: dbConfig.authSource,
  };
};

// Export all configurations together for convenience
export default {
  dbConfig,
  monitoringConfig,
  isDevelopment,
  isProduction,
  isTest,
};

// Export type definition
export type { MongoDBConfig };
