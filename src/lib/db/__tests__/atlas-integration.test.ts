import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectToDatabase, disconnectFromDatabase, checkDatabaseHealth } from '../mongodb';
import { getAtlasConfig, getMonitoringConfig } from '../atlas-config';

describe('MongoDB Atlas Integration', () => {
  let mongoServer: MongoMemoryServer;
  
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();
  });

  afterAll(async () => {
    await disconnectFromDatabase();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    if (mongoose.connection.readyState !== 0) {
      await disconnectFromDatabase();
    }
  });

  describe('Connection Management', () => {
    it('should connect successfully with Atlas configuration', async () => {
      const connection = await connectToDatabase();
      expect(connection.readyState).toBe(1);
      
      const config = getAtlasConfig('development');
      expect(config.ssl).toBe(true);
      expect(config.retryWrites).toBe(true);
      expect(config.authSource).toBe('admin');
    });

    it('should handle connection errors gracefully', async () => {
      const originalUri = process.env.MONGODB_URI;
      process.env.MONGODB_URI = 'mongodb://invalid-host:27017';
      
      await expect(connectToDatabase()).rejects.toThrow('Failed to connect to MongoDB Atlas');
      
      // Restore valid URI
      process.env.MONGODB_URI = originalUri;
    });

    it('should reuse existing connection', async () => {
      const connection1 = await connectToDatabase();
      const connection2 = await connectToDatabase();
      
      expect(connection1).toBe(connection2);
    });

    it('should handle disconnection and reconnection', async () => {
      const connection = await connectToDatabase();
      await disconnectFromDatabase();
      expect(connection.readyState).toBe(0);
      
      const newConnection = await connectToDatabase();
      expect(newConnection.readyState).toBe(1);
    });
  });

  describe('Health Checks', () => {
    it('should return healthy status for valid connection', async () => {
      await connectToDatabase();
      const health = await checkDatabaseHealth();
      
      expect(health.status).toBe('healthy');
      expect(health.latency).toBeGreaterThan(0);
      expect(health.metrics).toBeDefined();
      expect(health.metrics?.connections).toBeDefined();
      expect(health.timestamp).toBeDefined();
    });

    it('should include comprehensive metrics in health check', async () => {
      await connectToDatabase();
      const health = await checkDatabaseHealth();
      
      expect(health.metrics).toMatchObject({
        connections: expect.objectContaining({
          current: expect.any(Number),
          available: expect.any(Number),
          utilizationPercentage: expect.any(Number)
        })
      });

      if (health.metrics?.opcounters) {
        expect(health.metrics.opcounters).toMatchObject({
          insert: expect.any(Number),
          query: expect.any(Number),
          update: expect.any(Number),
          delete: expect.any(Number)
        });
      }
    });

    it('should handle health check with disconnected database', async () => {
      await disconnectFromDatabase();
      const health = await checkDatabaseHealth();
      
      expect(health.status).toBe('unhealthy');
      expect(health.message).toContain('Database health check failed');
    });
  });

  describe('Monitoring Configuration', () => {
    it('should load monitoring configuration correctly', () => {
      process.env.MONGODB_METRICS_ENABLED = 'true';
      process.env.MONGODB_METRICS_INTERVAL = '30';
      process.env.MONGODB_SLOW_QUERY_THRESHOLD = '200';
      
      const config = getMonitoringConfig();
      
      expect(config.metrics.enabled).toBe(true);
      expect(config.metrics.intervalSeconds).toBe(30);
      expect(config.alerts.queryPerformance.slowQueryThresholdMs).toBe(200);
    });

    it('should handle missing environment variables with defaults', () => {
      delete process.env.MONGODB_METRICS_ENABLED;
      delete process.env.MONGODB_METRICS_INTERVAL;
      delete process.env.MONGODB_SLOW_QUERY_THRESHOLD;
      
      const config = getMonitoringConfig();
      
      expect(config.metrics.enabled).toBe(false);
      expect(config.metrics.intervalSeconds).toBe(60);
      expect(config.alerts.queryPerformance.slowQueryThresholdMs).toBe(100);
    });
  });

  describe('Atlas-Specific Features', () => {
    it('should configure production settings appropriately', () => {
      const config = getAtlasConfig('production');
      
      expect(config.writeConcern?.w).toBe('majority');
      expect(config.maxPoolSize).toBeGreaterThan(config.minPoolSize);
      expect(config.autoIndex).toBe(false);
      expect(config.readPreference?.toString()).toBe('primaryPreferred');
    });

    it('should configure development settings appropriately', () => {
      const config = getAtlasConfig('development');
      
      expect(config.writeConcern?.w).toBe(1);
      expect(config.maxPoolSize).toBe(10);
      expect(config.autoIndex).toBe(true);
      expect(config.readPreference?.toString()).toBe('primary');
    });
  });
});