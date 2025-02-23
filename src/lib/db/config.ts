import { ConnectOptions } from 'mongoose';
import { ReadPreferenceMode } from 'mongodb';

// Base configuration shared between all environments
const baseConfig: ConnectOptions = {
  autoIndex: true,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  family: 4,
};

// Development environment configuration
const developmentConfig: ConnectOptions = {
  ...baseConfig,
  maxPoolSize: 5,
  minPoolSize: 1,
  maxIdleTimeMS: 60000, // 1 minute
  connectTimeoutMS: 30000,
  ssl: false, // Disable SSL for local development
  // Development specific logging will be handled through mongoose.set('debug', true)
};

// Production environment configuration
const productionConfig: ConnectOptions = {
  ...baseConfig,
  maxPoolSize: 50,
  minPoolSize: 10,
  maxIdleTimeMS: 120000, // 2 minutes
  connectTimeoutMS: 20000,
  ssl: true,  // Enable SSL for production
  // Disable auto-indexing in production
  autoIndex: false,
  // Enable write concern for production
  writeConcern: {
    w: 'majority',
    wtimeoutMS: 2500,
  },
  retryWrites: true,
  // Read from secondaries when possible
  readPreference: 'secondaryPreferred' as ReadPreferenceMode,
  // Keep connections alive with heartbeat
  heartbeatFrequencyMS: 300000, // 5 minutes
};

// Test environment configuration
const testConfig: ConnectOptions = {
  ...baseConfig,
  maxPoolSize: 5,
  minPoolSize: 1,
  maxIdleTimeMS: 30000, // 30 seconds
  connectTimeoutMS: 10000,
  ssl: false, // Disable SSL for testing
};

// Get configuration based on environment
export const getMongoConfig = (): ConnectOptions => {
  const config = (() => {
    switch (process.env.NODE_ENV) {
      case 'production':
        return productionConfig;
      case 'test':
        return testConfig;
      case 'development':
      default:
        // Enable debug mode in development
        if (process.env.NODE_ENV === 'development') {
          // This is the proper way to enable debugging in Mongoose
          require('mongoose').set('debug', true);
        }
        return developmentConfig;
    }
  })();

  return config;
};

// Validate MongoDB URI
export const validateMongoURI = (uri: string): boolean => {
  if (!uri) return false;
  
  try {
    // Basic URI validation
    const mongoRegex = /^mongodb(\\+srv)?:\/\/.+/;
    if (!mongoRegex.test(uri)) return false;

    // Parse URI to validate structure
    const url = new URL(uri);
    
    // For local development, we don't require username/password
    if (process.env.NODE_ENV === 'development') {
      return !!url.hostname;  // Only require hostname for local development
    }
    
    // For production, require full authentication
    if (!url.username || !url.password) return false;
    if (!url.hostname) return false;
    
    return true;
  } catch (error) {
    return false;
  }
};

// Get sanitized URI for logging (hiding credentials)
export const getSanitizedURI = (uri: string): string => {
  try {
    const url = new URL(uri);
    if (url.username && url.password) {
      return uri.replace(`${url.username}:${url.password}`, '***:***');
    }
    return uri;
  } catch {
    return uri.replace(/\/\/(.*?):(.*?)@/, '//***:***@');
  }
};