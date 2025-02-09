import { validateMongoURI, getSanitizedURI, getMongoConfig } from '../config';
import { connectToDatabase, disconnectFromDatabase, checkDatabaseHealth } from '../mongodb';
import mongoose from 'mongoose';

describe('MongoDB Configuration', () => {
  describe('validateMongoURI', () => {
    it('should validate correct MongoDB URIs', () => {
      const validURIs = [
        'mongodb://user:pass@localhost:27017/db',
        'mongodb+srv://user:pass@cluster.mongodb.net/db',
        'mongodb://user:pass@host1:27017,host2:27017/db'
      ];

      validURIs.forEach(uri => {
        expect(validateMongoURI(uri)).toBe(true);
      });
    });

    it('should reject invalid MongoDB URIs', () => {
      const invalidURIs = [
        '',
        'invalid-uri',
        'postgresql://user:pass@localhost:5432/db',
        'mongodb://',
        'mongodb://localhost'
      ];

      invalidURIs.forEach(uri => {
        expect(validateMongoURI(uri)).toBe(false);
      });
    });
  });

  describe('getSanitizedURI', () => {
    it('should hide credentials in MongoDB URI', () => {
      const uri = 'mongodb://username:password123@host:27017/db';
      const sanitized = getSanitizedURI(uri);
      expect(sanitized).toBe('mongodb://***:***@host:27017/db');
    });

    it('should handle malformed URIs gracefully', () => {
      const uri = 'malformed//user:pass@host';
      const sanitized = getSanitizedURI(uri);
      expect(sanitized).toBe('malformed//***:***@host');
    });
  });

  describe('getMongoConfig', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should return development config in development environment', () => {
      process.env.NODE_ENV = 'development';
      const config = getMongoConfig();
      expect(config.debug).toBe(true);
      expect(config.maxPoolSize).toBe(5);
    });

    it('should return production config in production environment', () => {
      process.env.NODE_ENV = 'production';
      const config = getMongoConfig();
      expect(config.debug).toBeUndefined();
      expect(config.maxPoolSize).toBe(50);
      expect(config.w).toBe('majority');
    });

    it('should return test config in test environment', () => {
      process.env.NODE_ENV = 'test';
      const config = getMongoConfig();
      expect(config.maxPoolSize).toBe(5);
      expect(config.maxIdleTimeMS).toBe(30000);
    });
  });
});

describe('MongoDB Connection', () => {
  const originalEnv = process.env.MONGODB_URI;

  beforeAll(() => {
    // Setup test database URI
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test-db';
  });

  afterAll(async () => {
    // Restore original environment
    process.env.MONGODB_URI = originalEnv;
    await mongoose.disconnect();
  });

  afterEach(async () => {
    await disconnectFromDatabase();
  });

  it('should connect to database successfully', async () => {
    const connection = await connectToDatabase();
    expect(connection.readyState).toBe(1); // Connected
  });

  it('should reuse existing connection', async () => {
    const connection1 = await connectToDatabase();
    const connection2 = await connectToDatabase();
    expect(connection1).toBe(connection2);
  });

  it('should handle disconnection properly', async () => {
    const connection = await connectToDatabase();
    expect(connection.readyState).toBe(1);
    
    await disconnectFromDatabase();
    expect(connection.readyState).toBe(0); // Disconnected
  });

  describe('Health Check', () => {
    it('should return healthy status for working connection', async () => {
      await connectToDatabase();
      const health = await checkDatabaseHealth();
      
      expect(health.status).toBe('healthy');
      expect(health.latency).toBeGreaterThan(0);
      expect(health.message).toBe('Database is responding normally');
    });

    it('should return unhealthy status for broken connection', async () => {
      await disconnectFromDatabase();
      const health = await checkDatabaseHealth();
      
      expect(health.status).toBe('unhealthy');
      expect(health.latency).toBe(-1);
      expect(health.message).toContain('Database health check failed');
    });
  });
});