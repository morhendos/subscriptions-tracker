/**
 * Database Module
 * 
 * Serves as the entry point for database operations, exposing a clean API
 * for the rest of the application to use.
 */

// Export connection manager
export { default as MongoConnectionManager } from './connection-manager';

// Export database operations
export * from './operations';

// Export error handling utilities
export * from './error-handler';
export * from './unified-error-handler';

// Re-export useful types
export { Connection } from 'mongoose';
