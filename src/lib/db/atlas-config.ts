import { ConnectionOptions } from 'mongoose';

/**
 * MongoDB Atlas specific configuration interface
 */
interface AtlasConfig extends ConnectionOptions {
  replicaSet?: string;
  readPreference: string;
  retryWrites: boolean;
  w: string | number;
  maxStalenessSeconds?: number;
}

/**
 * MongoDB Atlas configuration for different environments
 */
export const getAtlasConfig = (env: string = process.env.NODE_ENV || 'development'): AtlasConfig => {
  // Base configuration for all environments
  const baseConfig: AtlasConfig = {
    retryWrites: true,
    w: 'majority',
    readPreference: 'primary',
    ssl: true,
    maxPoolSize: 50,
    minPoolSize: 10,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 20000,
    serverSelectionTimeoutMS: 30000,
    heartbeatFrequencyMS: 10000,
  };

  switch (env) {
    case 'production':
      return {
        ...baseConfig,
        maxPoolSize: 100,
        minPoolSize: 20,
        maxIdleTimeMS: 120000, // 2 minutes
        // Production specific settings
        readPreference: 'primaryPreferred',
        w: 'majority',
        // Staleness settings for secondaries
        maxStalenessSeconds: 90,
        // Connection pool settings
        waitQueueTimeoutMS: 15000,
        // Monitoring settings
        monitorCommands: true,
        serverMonitoringMode: 'auto',
      };

    case 'staging':
      return {
        ...baseConfig,
        maxPoolSize: 50,
        minPoolSize: 10,
        maxIdleTimeMS: 60000, // 1 minute
        // Staging specific settings
        readPreference: 'primaryPreferred',
        w: 'majority',
        monitorCommands: true,
      };

    case 'test':
      return {
        ...baseConfig,
        maxPoolSize: 10,
        minPoolSize: 2,
        maxIdleTimeMS: 30000, // 30 seconds
        // Test specific settings
        readPreference: 'primary',
        w: 1,
        monitorCommands: false,
      };

    default: // development
      return {
        ...baseConfig,
        maxPoolSize: 10,
        minPoolSize: 2,
        maxIdleTimeMS: 60000, // 1 minute
        // Development specific settings
        readPreference: 'primary',
        w: 1,
        monitorCommands: true,
        debug: true,
      };
  }
};

/**
 * Get backup configuration for MongoDB Atlas
 */
export const getBackupConfig = () => ({
  enabled: process.env.MONGODB_BACKUP_ENABLED === 'true',
  schedule: {
    type: process.env.MONGODB_BACKUP_TYPE || 'scheduled',
    hourly: {
      retentionDays: parseInt(process.env.MONGODB_BACKUP_HOURLY_RETENTION || '24', 10),
    },
    daily: {
      retentionDays: parseInt(process.env.MONGODB_BACKUP_DAILY_RETENTION || '7', 10),
      preferredTime: process.env.MONGODB_BACKUP_PREFERRED_TIME || '02:00',
    },
    weekly: {
      retentionWeeks: parseInt(process.env.MONGODB_BACKUP_WEEKLY_RETENTION || '4', 10),
      preferredDay: process.env.MONGODB_BACKUP_PREFERRED_DAY || 'Sunday',
    },
    monthly: {
      retentionMonths: parseInt(process.env.MONGODB_BACKUP_MONTHLY_RETENTION || '12', 10),
      preferredDate: parseInt(process.env.MONGODB_BACKUP_PREFERRED_DATE || '1', 10),
    },
  },
});

/**
 * Get monitoring configuration for MongoDB Atlas
 */
export const getMonitoringConfig = () => ({
  metrics: {
    enabled: true,
    intervalSeconds: parseInt(process.env.MONGODB_METRICS_INTERVAL || '60', 10),
  },
  alerts: {
    connectionPoolUtilization: {
      enabled: true,
      threshold: parseInt(process.env.MONGODB_ALERT_POOL_THRESHOLD || '80', 10),
    },
    opLogLag: {
      enabled: true,
      thresholdSeconds: parseInt(process.env.MONGODB_ALERT_OPLOG_LAG || '10', 10),
    },
    replicationLag: {
      enabled: true,
      thresholdSeconds: parseInt(process.env.MONGODB_ALERT_REPLICATION_LAG || '20', 10),
    },
    queryPerformance: {
      enabled: true,
      slowQueryThresholdMs: parseInt(process.env.MONGODB_ALERT_SLOW_QUERY || '100', 10),
    },
  },
  logging: {
    profilerEnabled: process.env.NODE_ENV === 'production',
    slowQueryThresholdMs: parseInt(process.env.MONGODB_SLOW_QUERY_THRESHOLD || '100', 10),
    logRotationDays: parseInt(process.env.MONGODB_LOG_ROTATION_DAYS || '7', 10),
  },
});