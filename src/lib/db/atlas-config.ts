import { ConnectOptions } from 'mongoose';
import { ReadPreference, ReadPreferenceMode } from 'mongodb';

type MongoCompressor = 'none' | 'snappy' | 'zlib' | 'zstd';

/**
 * MongoDB Atlas specific configuration interface
 */
export interface MongoDBAtlasConfig {
  retryWrites: boolean;
  w: number | 'majority';  // Write concern
  readPreference: ReadPreferenceMode;
  maxPoolSize: number;
  minPoolSize: number;
  maxIdleTimeMS: number;
  serverSelectionTimeoutMS: number;
  socketTimeoutMS: number;
  connectTimeoutMS: number;
  autoIndex: boolean;
  autoCreate: boolean;
  // Atlas-specific options
  replicaSet?: string;
  ssl: boolean;
  authSource: string;
  retryReads: boolean;
  compressors?: MongoCompressor[];
}

/**
 * Default MongoDB Atlas configuration values for production environment
 * Optimized for M10+ clusters
 */
const ATLAS_PRODUCTION_CONFIG: MongoDBAtlasConfig = {
  retryWrites: true,
  w: 'majority',
  readPreference: 'primaryPreferred',
  maxPoolSize: 100,  // Increased for better connection handling
  minPoolSize: 20,   // Increased to maintain warm connections
  maxIdleTimeMS: 30000, // Reduced to better manage resources
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  autoIndex: false,  // Disable auto-indexing in production
  autoCreate: false,
  ssl: true,
  authSource: 'admin',
  retryReads: true,
  compressors: ['zlib', 'snappy'] as MongoCompressor[],  // Enable network compression
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
  ssl: true,
  authSource: 'admin',
  retryReads: true,
  compressors: ['zlib'] as MongoCompressor[],
};

/**
 * Get MongoDB Atlas configuration based on environment
 * @param env - Environment ('development' | 'production')
 * @returns MongoDB connection options
 */
export function getAtlasConfig(env?: string): ConnectOptions {
  const isProduction = env === 'production';
  const config = isProduction ? ATLAS_PRODUCTION_CONFIG : ATLAS_DEVELOPMENT_CONFIG;

  // Create the read preference instance
  const readPref = new ReadPreference(config.readPreference as ReadPreferenceMode);

  // Create a type-safe configuration object
  const mongooseConfig: ConnectOptions = {
    retryWrites: config.retryWrites,
    writeConcern: {
      w: config.w,
      j: isProduction, // Enable journal in production
    },
    readPreference: readPref,
    maxPoolSize: config.maxPoolSize,
    minPoolSize: config.minPoolSize,
    serverSelectionTimeoutMS: config.serverSelectionTimeoutMS,
    socketTimeoutMS: config.socketTimeoutMS,
    connectTimeoutMS: config.connectTimeoutMS,
    autoIndex: config.autoIndex,
    autoCreate: config.autoCreate,
    ssl: config.ssl,
    authSource: config.authSource,
    retryReads: config.retryReads,
    compressors: config.compressors,
  };

  if (isProduction) {
    // Additional production-specific settings
    Object.assign(mongooseConfig, {
      keepAlive: true,
      keepAliveInitialDelay: 300000, // 5 minutes
      maxIdleTimeMS: config.maxIdleTimeMS,
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 10000,
    });
  }

  return mongooseConfig;
}

/**
 * Monitoring configuration interface
 */
export interface MonitoringConfig {
  metrics: {
    enabled: boolean;
    intervalSeconds: number;
    customMetrics?: string[];
  };
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
  logging: {
    slowQueryThresholdMs: number;
    rotationDays: number;
    level: 'error' | 'warn' | 'info' | 'debug';
    mongoDBProfileLevel: 0 | 1 | 2;
  };
}

/**
 * Get monitoring configuration with enhanced Atlas metrics
 */
export function getMonitoringConfig(): MonitoringConfig {
  return {
    metrics: {
      enabled: process.env.MONGODB_METRICS_ENABLED === 'true',
      intervalSeconds: parseInt(process.env.MONGODB_METRICS_INTERVAL || '60', 10),
      customMetrics: [
        'atlas.numberOfConnections',
        'atlas.opcounters',
        'atlas.memory',
        'atlas.network',
      ],
    },
    alerts: {
      queryPerformance: {
        enabled: true,
        slowQueryThresholdMs: parseInt(process.env.MONGODB_SLOW_QUERY_THRESHOLD || '100', 10),
        aggregationThresholdMs: parseInt(process.env.MONGODB_AGGREGATION_THRESHOLD || '1000', 10),
      },
      connectionPoolUtilization: {
        enabled: true,
        threshold: parseInt(process.env.MONGODB_ALERT_POOL_THRESHOLD || '80', 10),
        criticalThreshold: parseInt(process.env.MONGODB_ALERT_POOL_CRITICAL || '90', 10),
      },
      replication: {
        enabled: true,
        maxLagSeconds: parseInt(process.env.MONGODB_MAX_REPLICATION_LAG || '10', 10),
      },
    },
    logging: {
      slowQueryThresholdMs: parseInt(process.env.MONGODB_SLOW_QUERY_THRESHOLD || '100', 10),
      rotationDays: parseInt(process.env.MONGODB_LOG_ROTATION_DAYS || '7', 10),
      level: (process.env.MONGODB_LOG_LEVEL || 'info') as 'error' | 'warn' | 'info' | 'debug',
      mongoDBProfileLevel: parseInt(process.env.MONGODB_PROFILE_LEVEL || '1', 10) as 0 | 1 | 2,
    },
  };
}