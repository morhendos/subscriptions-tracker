import { ConnectionOptions } from 'mongoose';

// Base configuration shared between all environments
const baseConfig: ConnectionOptions = {
  autoIndex: true,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  family: 4,
  ssl: true,
};

// Development environment configuration
const developmentConfig: ConnectionOptions = {
  ...baseConfig,
  maxPoolSize: 5,
  minPoolSize: 1,
  maxIdleTimeMS: 60000, // 1 minute
  connectTimeoutMS: 30000,
  // Enable detailed logging in development
  debug: true,
};

// Production environment configuration
const productionConfig: ConnectionOptions = {
  ...baseConfig,
  maxPoolSize: 50,
  minPoolSize: 10,
  maxIdleTimeMS: 120000, // 2 minutes
  connectTimeoutMS: 20000,
  // Disable auto-indexing in production
  autoIndex: false,
  // Enable write concern for production
  w: 'majority',
  wtimeout: 2500,
  retryWrites: true,
  // Read from secondaries when possible
  readPreference: 'secondaryPreferred',
  // Keep idle connections alive
  keepAlive: true,
  keepAliveInitialDelay: 300000, // 5 minutes
};

// Test environment configuration
const testConfig: ConnectionOptions = {
  ...baseConfig,
  maxPoolSize: 5,
  minPoolSize: 1,
  maxIdleTimeMS: 30000, // 30 seconds
  connectTimeoutMS: 10000,
};

// Get configuration based on environment
export const getMongoConfig = (): ConnectionOptions => {
  switch (process.env.NODE_ENV) {
    case 'production':
      return productionConfig;
    case 'test':
      return testConfig;
    case 'development':
    default:
      return developmentConfig;
  }
};

// Validate MongoDB URI
export const validateMongoURI = (uri: string): boolean => {
  if (!uri) return false;
  
  try {
    // Basic URI validation
    const mongoRegex = /^mongodb(\+srv)?:\/\/.+/;
    if (!mongoRegex.test(uri)) return false;

    // Parse URI to validate structure
    const url = new URL(uri);
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
    return uri.replace(`${url.username}:${url.password}`, '***:***');
  } catch {
    return uri.replace(/\/\/(.*?):(.+?)@/, '//***:***@');
  }
};