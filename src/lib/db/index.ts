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

// For backward compatibility with existing code
import { MongoConnectionManager } from './connection-manager';
import { ConsoleLogger } from './connection-manager';

/**
 * Get a MongoDB connection (legacy method for compatibility)
 * 
 * @param options Connection options
 * @returns A Promise resolving to a Connection
 */
export const getConnection = async (options: any = {}) => {
  const manager = MongoConnectionManager.getInstance();
  return manager.getConnection(options);
};

/**
 * Disconnect all MongoDB connections (legacy method for compatibility)
 * 
 * @returns A Promise that resolves when disconnection is complete
 */
export const disconnectAll = async () => {
  return MongoConnectionManager.disconnectAll();
};

/**
 * Create a logger instance (legacy method for compatibility)
 * 
 * @param prefix The prefix for log messages
 * @returns A logger instance
 */
export const createLogger = (prefix: string) => {
  class PrefixedLogger extends ConsoleLogger {
    prefix: string;
    
    constructor(prefix: string) {
      super();
      this.prefix = prefix;
    }

    debug(message: string, ...args: any[]): void {
      super.debug(`[${this.prefix}] ${message}`, ...args);
    }
    
    info(message: string, ...args: any[]): void {
      super.info(`[${this.prefix}] ${message}`, ...args);
    }
    
    warn(message: string, ...args: any[]): void {
      super.warn(`[${this.prefix}] ${message}`, ...args);
    }
    
    error(message: string, ...args: any[]): void {
      super.error(`[${this.prefix}] ${message}`, ...args);
    }
  }
  
  return new PrefixedLogger(prefix);
};