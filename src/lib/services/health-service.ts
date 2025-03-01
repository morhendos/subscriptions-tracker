/**
 * Health Service
 * 
 * This module provides service functions for health check operations.
 * It centralizes health check logic for database and system components.
 */

import { withErrorHandling } from '@/lib/db/unified-error-handler';
import { MongoConnectionManager } from '@/lib/db/connection-manager';
import { checkDatabaseHealth } from '@/lib/db/mongodb';
import { SubscriptionModel } from '@/models/subscription';
import mongoose from 'mongoose';

/**
 * Health status response type
 */
export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  latency?: number;
  details?: any;
  timestamp: string;
}

/**
 * Database health response type
 */
export interface DatabaseHealthResponse extends HealthStatus {
  connection: {
    latency: number;
    readyState: string;
  };
}

/**
 * System health response type
 */
export interface SystemHealthResponse extends HealthStatus {
  database: {
    status: 'healthy' | 'unhealthy' | 'error';
    error?: string;
  };
  schemas: {
    subscriptionModel: boolean;
    collections: string[];
  };
}

/**
 * Get database health status
 * 
 * @returns Database health information
 */
export async function getDatabaseHealth(): Promise<DatabaseHealthResponse> {
  return withErrorHandling(async () => {
    // Get the connection manager singleton
    const connectionManager = MongoConnectionManager.getInstance();
    
    // Check connection health
    const healthCheck = await connectionManager.checkHealth();
    
    // Return health status with connection details
    return {
      status: healthCheck.status,
      connection: {
        latency: healthCheck.latency,
        readyState: healthCheck.details?.readyState || 'unknown',
      },
      timestamp: new Date().toISOString(),
    };
  }, 'getDatabaseHealth');
}

/**
 * Get overall system health status
 * 
 * @returns System health information
 */
export async function getSystemHealth(): Promise<SystemHealthResponse> {
  return withErrorHandling(async () => {
    // Check basic database health
    const health = await checkDatabaseHealth();
    
    // Initialize schema health information
    const schemaHealth = {
      subscriptionModel: !!SubscriptionModel,
      collections: [] as string[]
    };

    // If database is connected, check collections
    if (health.status === 'healthy' && 
        mongoose.connection.readyState === 1 && // 1 = connected
        mongoose.connection.db) {
      try {
        const collections = await mongoose.connection.db.collections();
        schemaHealth.collections = collections.map(col => col.collectionName);
      } catch (collectionError) {
        console.warn('[Health Check] Error fetching collections:', collectionError);
        // Continue without collections data rather than failing completely
      }
    }

    // Return complete health status
    return {
      ...health,
      schemas: schemaHealth,
      timestamp: new Date().toISOString()
    };
  }, 'getSystemHealth');
}
