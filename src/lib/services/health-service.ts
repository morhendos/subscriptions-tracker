/**
 * Health Service
 * 
 * This module provides service functions for health checks.
 */

import { withConnection } from '@/lib/db/simplified-connection';
import { withErrorHandling } from '@/lib/db/unified-error-handler';
import mongoose from 'mongoose';
import os from 'os';
import { getConnectionManager } from '@/lib/db';

/**
 * Get database health status
 */
export async function getDatabaseHealth() {
  return withErrorHandling(async () => {
    const startTime = Date.now();
    
    // Get database connection
    const connection = await withConnection(async () => {
      return mongoose.connection;
    });
    
    const responseTime = Date.now() - startTime;
    
    // Check if database is connected
    const isConnected = connection.readyState === 1;
    
    // Get connection manager to access more details
    const connectionManager = getConnectionManager();
    
    return {
      status: isConnected ? 'connected' : 'disconnected',
      readyState: connection.readyState,
      responseTime: `${responseTime}ms`,
      dbName: connection.db?.databaseName || 'unknown',
      host: connection.host || 'unknown',
      poolSize: connectionManager.getActiveConnections() || 0,
      success: isConnected
    };
  }, 'getDatabaseHealth');
}

/**
 * Get overall system health status
 */
export async function getSystemHealth() {
  return withErrorHandling(async () => {
    // Check database health
    const dbHealth = await getDatabaseHealth();
    
    // Get system info
    const systemInfo = {
      uptime: Math.floor(process.uptime()),
      memory: {
        total: Math.round(os.totalmem() / (1024 * 1024)),
        free: Math.round(os.freemem() / (1024 * 1024)),
        usage: Math.round((1 - os.freemem() / os.totalmem()) * 100)
      },
      loadAvg: os.loadavg(),
      nodeEnv: process.env.NODE_ENV || 'development'
    };
    
    return {
      database: dbHealth,
      system: systemInfo,
      timestamp: new Date().toISOString(),
      success: dbHealth.success
    };
  }, 'getSystemHealth');
}
