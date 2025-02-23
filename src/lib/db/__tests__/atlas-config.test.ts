import { getAtlasConfig, getMonitoringConfig, getBackupConfig } from '../atlas-config';

describe('MongoDB Atlas Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getAtlasConfig', () => {
    it('should return production configuration when in production', () => {
      const config = getAtlasConfig('production');
      expect(config.retryWrites).toBe(true);
      expect(config.w).toBe('majority');
      expect(config.maxPoolSize).toBe(100);
      expect(config.minPoolSize).toBe(20);
      expect(config.readPreference).toBe('primaryPreferred');
    });

    it('should return development configuration by default', () => {
      const config = getAtlasConfig();
      expect(config.maxPoolSize).toBe(10);
      expect(config.minPoolSize).toBe(2);
      expect(config.debug).toBe(true);
      expect(config.readPreference).toBe('primary');
    });

    it('should return staging configuration when in staging', () => {
      const config = getAtlasConfig('staging');
      expect(config.maxPoolSize).toBe(50);
      expect(config.minPoolSize).toBe(10);
      expect(config.readPreference).toBe('primaryPreferred');
    });

    it('should return test configuration when in test environment', () => {
      const config = getAtlasConfig('test');
      expect(config.maxPoolSize).toBe(10);
      expect(config.minPoolSize).toBe(2);
      expect(config.maxIdleTimeMS).toBe(30000);
    });

    it('should include SSL configuration in all environments', () => {
      const environments = ['development', 'staging', 'production', 'test'];
      environments.forEach(env => {
        const config = getAtlasConfig(env);
        expect(config.ssl).toBe(true);
      });
    });
  });

  describe('getMonitoringConfig', () => {
    beforeEach(() => {
      process.env.MONGODB_METRICS_INTERVAL = '30';
      process.env.MONGODB_ALERT_POOL_THRESHOLD = '75';
      process.env.MONGODB_ALERT_SLOW_QUERY = '200';
      process.env.MONGODB_LOG_ROTATION_DAYS = '14';
    });

    it('should use environment variables for configuration', () => {
      const config = getMonitoringConfig();
      expect(config.metrics.intervalSeconds).toBe(30);
      expect(config.alerts.connectionPoolUtilization.threshold).toBe(75);
      expect(config.alerts.queryPerformance.slowQueryThresholdMs).toBe(200);
      expect(config.logging.logRotationDays).toBe(14);
    });

    it('should use default values when environment variables are not set', () => {
      process.env.MONGODB_METRICS_INTERVAL = '';
      process.env.MONGODB_ALERT_POOL_THRESHOLD = '';
      
      const config = getMonitoringConfig();
      expect(config.metrics.intervalSeconds).toBe(60); // default value
      expect(config.alerts.connectionPoolUtilization.threshold).toBe(80); // default value
    });

    it('should enable profiler in production', () => {
      process.env.NODE_ENV = 'production';
      const config = getMonitoringConfig();
      expect(config.logging.profilerEnabled).toBe(true);
    });

    it('should disable profiler in development', () => {
      process.env.NODE_ENV = 'development';
      const config = getMonitoringConfig();
      expect(config.logging.profilerEnabled).toBe(false);
    });
  });

  describe('getBackupConfig', () => {
    beforeEach(() => {
      process.env.MONGODB_BACKUP_ENABLED = 'true';
      process.env.MONGODB_BACKUP_TYPE = 'scheduled';
      process.env.MONGODB_BACKUP_HOURLY_RETENTION = '48';
      process.env.MONGODB_BACKUP_DAILY_RETENTION = '14';
      process.env.MONGODB_BACKUP_PREFERRED_TIME = '03:00';
    });

    it('should use environment variables for backup configuration', () => {
      const config = getBackupConfig();
      expect(config.enabled).toBe(true);
      expect(config.schedule.type).toBe('scheduled');
      expect(config.schedule.hourly.retentionDays).toBe(48);
      expect(config.schedule.daily.retentionDays).toBe(14);
      expect(config.schedule.daily.preferredTime).toBe('03:00');
    });

    it('should use default values when environment variables are not set', () => {
      process.env.MONGODB_BACKUP_HOURLY_RETENTION = '';
      process.env.MONGODB_BACKUP_DAILY_RETENTION = '';
      process.env.MONGODB_BACKUP_PREFERRED_TIME = '';
      
      const config = getBackupConfig();
      expect(config.schedule.hourly.retentionDays).toBe(24); // default value
      expect(config.schedule.daily.retentionDays).toBe(7); // default value
      expect(config.schedule.daily.preferredTime).toBe('02:00'); // default value
    });

    it('should handle disabled backups', () => {
      process.env.MONGODB_BACKUP_ENABLED = 'false';
      const config = getBackupConfig();
      expect(config.enabled).toBe(false);
    });
  });
});