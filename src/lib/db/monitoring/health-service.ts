/**
 * MongoDB Health Service
 * 
 * Provides functionality to check the health of MongoDB connections,
 * collect performance metrics, and perform diagnostics.
 */
import mongoose from 'mongoose';
import { Logger } from '../logger/logger';
import { mongodbConfig } from '@/config/database-config';

/**
 * Health check interval in milliseconds
 */
const HEALTH_CHECK_INTERVAL = 60000; // 1 minute

/**
 * MongoDB Connection Health Status
 */
export enum ConnectionHealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy'
}

/**
 * Connection metrics interface
 */
export interface ConnectionMetrics {
  // Connection metrics
  connections: {
    current: number;
    available: number;
    utilizationPercentage: number;
  };
  
  // Operation counters
  opcounters?: {
    insert: number;
    query: number;
    update: number;
    delete: number;
    getmore: number;
    command: number;
  };
  
  // Replication metrics (if available)
  replication?: {
    status: Array<{
      name: string;
      state: string;
      health: number;
    }>;
    maxLagMs?: number;
  };
  
  // Memory metrics
  memory?: {
    bits: number;
    resident: number;
    virtual: number;
    mapped?: number;
  };
  
  // Latency metrics
  latency: number;
  
  // Timestamp
  timestamp: string;
}

/**
 * Health check result interface
 */
export interface HealthCheckResult {
  status: ConnectionHealthStatus;
  latency: number;
  message?: string;
  metrics?: ConnectionMetrics;
  timestamp: string;
}

/**
 * MongoDB Health Service
 * 
 * Provides functionality to check the health of MongoDB connections and
 * collect performance metrics.
 */
export class HealthService {
  private readonly logger: Logger;
  private isCheckingHealth = false;
  private cachedMetrics?: ConnectionMetrics;
  private healthCheckInterval?: NodeJS.Timeout;
  
  /**
   * Create a new health service instance
   * @param logger - Logger instance
   */
  constructor(logger: Logger) {
    this.logger = logger.child('HealthService');
  }
  
  /**
   * Start periodic health checks
   * @param connection - Mongoose connection to monitor
   */
  public startHealthChecks(connection: mongoose.Connection): void {
    if (this.healthCheckInterval) {
      this.stopHealthChecks();
    }
    
    this.logger.info('Starting periodic health checks');
    
    this.healthCheckInterval = setInterval(async () => {
      if (this.isCheckingHealth) {
        return;
      }
      
      this.isCheckingHealth = true;
      
      try {
        const result = await this.checkHealth(connection);
        
        if (result.status !== ConnectionHealthStatus.HEALTHY) {
          this.logger.warn('Health check detected issues', { 
            status: result.status,
            message: result.message
          });
        }
        
        this.cachedMetrics = result.metrics;
      } catch (error) {
        this.logger.error('Health check failed', { error });
      } finally {
        this.isCheckingHealth = false;
      }
    }, HEALTH_CHECK_INTERVAL);
    
    // Ensure the interval is unref'd so it doesn't prevent the Node.js process from exiting
    this.healthCheckInterval.unref();
  }
  
  /**
   * Stop periodic health checks
   */
  public stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
      this.logger.info('Stopped periodic health checks');
    }
  }
  
  /**
   * Get the cached metrics
   * @returns The cached metrics or undefined if no metrics are available
   */
  public getCachedMetrics(): ConnectionMetrics | undefined {
    return this.cachedMetrics;
  }
  
  /**
   * Check the health of a MongoDB connection
   * @param connection - Mongoose connection to check
   * @returns Health check result
   */
  public async checkHealth(connection: mongoose.Connection): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    try {
      if (!connection.db) {
        throw new Error('Database connection not established');
      }
      
      const adminDb = connection.db.admin();
      
      // Execute checks in parallel
      const [ping, serverStatus, replSetStatus] = await Promise.all([
        adminDb.ping(),
        adminDb.serverStatus().catch(() => null),
        adminDb.command({ replSetGetStatus: 1 }).catch(() => null)
      ]);
      
      if (!ping.ok) {
        throw new Error('Database ping failed');
      }
      
      const latency = Date.now() - startTime;
      
      // Create metrics
      const metrics: ConnectionMetrics = {
        connections: {
          current: serverStatus?.connections?.current || 0,
          available: serverStatus?.connections?.available || 0,
          utilizationPercentage: serverStatus?.connections
            ? (serverStatus.connections.current / serverStatus.connections.available) * 100
            : 0
        },
        latency,
        timestamp
      };
      
      // Add operation counters if available
      if (serverStatus?.opcounters) {
        metrics.opcounters = serverStatus.opcounters;
      }
      
      // Add memory metrics if available
      if (serverStatus?.mem) {
        metrics.memory = serverStatus.mem;
      }
      
      // Add replication metrics if available
      if (replSetStatus) {
        metrics.replication = {
          status: replSetStatus.members.map((m: any) => ({
            name: m.name,
            state: m.stateStr,
            health: m.health
          })),
          maxLagMs: Math.max(...replSetStatus.members
            .filter((m: any) => !m.self)
            .map((m: any) => m.optimeDate)
          )
        };
      }
      
      // Determine health status
      let status = ConnectionHealthStatus.HEALTHY;
      let message = 'Database is healthy';
      
      // Check connection pool utilization
      if (metrics.connections.utilizationPercentage > mongodbConfig.monitoring.alerts.connectionPoolUtilization.criticalThreshold) {
        status = ConnectionHealthStatus.UNHEALTHY;
        message = `Connection pool utilization is critical: ${metrics.connections.utilizationPercentage.toFixed(2)}%`;
      } else if (metrics.connections.utilizationPercentage > mongodbConfig.monitoring.alerts.connectionPoolUtilization.threshold) {
        status = ConnectionHealthStatus.DEGRADED;
        message = `Connection pool utilization is high: ${metrics.connections.utilizationPercentage.toFixed(2)}%`;
      }
      
      // Check replication lag
      if (metrics.replication?.maxLagMs && metrics.replication.maxLagMs > mongodbConfig.monitoring.alerts.replication.maxLagSeconds * 1000) {
        status = status === ConnectionHealthStatus.HEALTHY 
          ? ConnectionHealthStatus.DEGRADED 
          : status;
        message = `Replication lag is high: ${(metrics.replication.maxLagMs / 1000).toFixed(2)}s`;
      }
      
      // Check latency
      if (latency > mongodbConfig.monitoring.alerts.queryPerformance.slowQueryThresholdMs) {
        status = status === ConnectionHealthStatus.HEALTHY 
          ? ConnectionHealthStatus.DEGRADED 
          : status;
        message = `Database latency is high: ${latency}ms`;
      }
      
      return {
        status,
        latency,
        message,
        metrics,
        timestamp
      };
    } catch (error: any) {
      const latency = Date.now() - startTime;
      
      this.logger.error('Health check failed', {
        error: error.message,
        latency
      });
      
      return {
        status: ConnectionHealthStatus.UNHEALTHY,
        latency,
        message: `Health check failed: ${error.message}`,
        timestamp
      };
    }
  }
}
