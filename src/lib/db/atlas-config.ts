import { ConnectOptions } from 'mongoose';

/**
 * MongoDB Atlas specific configuration interface
 */
export interface MongoDBAtlasConfig {
  retryWrites: boolean;
  w: string | number;
  readPreference: string;
  maxPoolSize: number;
  minPoolSize: number;
  maxIdleTimeMS: number;
  serverSelectionTimeoutMS: number;
  socketTimeoutMS: number;
  connectTimeoutMS: number;
  autoIndex: boolean;
  autoCreate: boolean;
}

/**
 * Default MongoDB Atlas configuration values for production environment
 */
const ATLAS_PRODUCTION_CONFIG: MongoDBAtlasConfig = {
  retryWrites: true,
  w: 'majority',
  readPreference: 'primary',
  maxPoolSize: 50,
  minPoolSize: 10,
  maxIdleTimeMS: 60000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  autoIndex: true,
  autoCreate: false,
};

/**
 * Default MongoDB Atlas configuration values for development environment
 */
const ATLAS_DEVELOPMENT_CONFIG: MongoDBAtlasConfig = {
  retryWrites: true,
  w: 1,
  readPreference: 'primary',
  maxPoolSize: 10,
  minPoolSize: 1,
  maxIdleTimeMS: 120000,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 60000,
  connectTimeoutMS: 20000,
  autoIndex: true,
  autoCreate: true,
};

/**
 * Get MongoDB Atlas configuration based on environment
 * @param env - Environment ('development' | 'production')
 * @returns MongoDB connection options
 */
export function getAtlasConfig(env?: string): ConnectOptions {
  const isProduction = env === 'production';
  const config = isProduction ? ATLAS_PRODUCTION_CONFIG : ATLAS_DEVELOPMENT_CONFIG;

  return {
    ...config,
    retryWrites: config.retryWrites,
    w: config.w,
    maxPoolSize: config.maxPoolSize,
    minPoolSize: config.minPoolSize,
    serverSelectionTimeoutMS: config.serverSelectionTimeoutMS,
    socketTimeoutMS: config.socketTimeoutMS,
    connectTimeoutMS: config.connectTimeoutMS,
    autoIndex: config.autoIndex,
    autoCreate: config.autoCreate,
  };
}

/**
 * Monitoring configuration interface
 */
export interface MonitoringConfig {
  metrics: {
    enabled: boolean;
    intervalSeconds: number;
  };
  alerts: {
    queryPerformance: {
      enabled: boolean;
      slowQueryThresholdMs: number;
    };
    connectionPoolUtilization: {
      enabled: boolean;
      threshold: number;
    };
  };
  logging: {
    slowQueryThresholdMs: number;
    rotationDays: number;
  };
}

/**
 * Get monitoring configuration
 */
export function getMonitoringConfig(): MonitoringConfig {
  return {
    metrics: {
      enabled: process.env.MONGODB_METRICS_ENABLED === 'true',
      intervalSeconds: parseInt(process.env.MONGODB_METRICS_INTERVAL || '60', 10),
    },
    alerts: {
      queryPerformance: {
        enabled: true,
        slowQueryThresholdMs: parseInt(process.env.MONGODB_SLOW_QUERY_THRESHOLD || '100', 10),
      },
      connectionPoolUtilization: {
        enabled: true,
        threshold: parseInt(process.env.MONGODB_ALERT_POOL_THRESHOLD || '80', 10),
      },
    },
    logging: {
      slowQueryThresholdMs: parseInt(process.env.MONGODB_SLOW_QUERY_THRESHOLD || '100', 10),
      rotationDays: parseInt(process.env.MONGODB_LOG_ROTATION_DAYS || '7', 10),
    },
  };
}