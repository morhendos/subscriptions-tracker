/**
 * MongoDB Atlas Configuration
 * 
 * Provides connection configuration for MongoDB Atlas deployments.
 * Uses the unified database configuration module for consistency.
 */
import { ConnectOptions } from 'mongoose';
import { ReadPreference, ReadPreferenceMode } from 'mongodb';
import { mongodbConfig, isDevelopment, isProduction } from '@/config/database-config';

/**
 * Get MongoDB Atlas configuration based on environment
 * Creates a properly formatted Mongoose ConnectOptions object.
 * 
 * @param env - Environment ('development' | 'production')
 * @returns MongoDB connection options
 */
export function getAtlasConfig(env?: string): ConnectOptions {
  const currentEnv = env || process.env.NODE_ENV || 'development';
  const isProductionEnv = currentEnv === 'production';
  
  // Create the read preference instance
  const readPref = new ReadPreference(mongodbConfig.readPreference as ReadPreferenceMode);

  // Create a type-safe configuration object with supported options
  const mongooseConfig: ConnectOptions = {
    retryWrites: mongodbConfig.retryWrites,
    writeConcern: {
      w: mongodbConfig.writeConcern,
      j: isProductionEnv, // Enable journal in production
    },
    readPreference: readPref,
    maxPoolSize: mongodbConfig.maxPoolSize,
    minPoolSize: mongodbConfig.minPoolSize,
    serverSelectionTimeoutMS: mongodbConfig.serverSelectionTimeoutMS,
    socketTimeoutMS: mongodbConfig.socketTimeoutMS,
    connectTimeoutMS: mongodbConfig.connectionTimeoutMS,
    autoIndex: mongodbConfig.autoIndex,
    autoCreate: mongodbConfig.autoCreate,
    ssl: mongodbConfig.ssl,
    authSource: mongodbConfig.authSource,
    retryReads: mongodbConfig.retryReads,
    compressors: mongodbConfig.compressors,
  };

  if (isProductionEnv) {
    // Additional production-specific settings that are supported
    Object.assign(mongooseConfig, {
      maxIdleTimeMS: mongodbConfig.maxIdleTimeMS,
      heartbeatFrequencyMS: 10000,
    });
  }

  return mongooseConfig;
}

/**
 * Get monitoring configuration with enhanced Atlas metrics
 * 
 * @returns MongoDB monitoring configuration
 */
export function getMonitoringConfig() {
  return {
    metrics: {
      enabled: mongodbConfig.monitoring.enabled,
      intervalSeconds: mongodbConfig.monitoring.metricsIntervalSeconds,
      customMetrics: [
        'atlas.numberOfConnections',
        'atlas.opcounters',
        'atlas.memory',
        'atlas.network',
      ],
    },
    alerts: {
      queryPerformance: {
        enabled: mongodbConfig.monitoring.alerts.queryPerformance.enabled,
        slowQueryThresholdMs: mongodbConfig.monitoring.alerts.queryPerformance.slowQueryThresholdMs,
        aggregationThresholdMs: mongodbConfig.monitoring.alerts.queryPerformance.aggregationThresholdMs,
      },
      connectionPoolUtilization: {
        enabled: mongodbConfig.monitoring.alerts.connectionPoolUtilization.enabled,
        threshold: mongodbConfig.monitoring.alerts.connectionPoolUtilization.threshold,
        criticalThreshold: mongodbConfig.monitoring.alerts.connectionPoolUtilization.criticalThreshold,
      },
      replication: {
        enabled: mongodbConfig.monitoring.alerts.replication.enabled,
        maxLagSeconds: mongodbConfig.monitoring.alerts.replication.maxLagSeconds,
      },
    },
    logging: {
      slowQueryThresholdMs: mongodbConfig.monitoring.logging.slowQueryThresholdMs,
      rotationDays: mongodbConfig.monitoring.logging.rotationDays,
      level: mongodbConfig.monitoring.logging.level,
      mongoDBProfileLevel: mongodbConfig.monitoring.logging.mongoDBProfileLevel,
    },
  };
}
