import { GET, OPTIONS } from '../route';
import { checkDatabaseHealth } from '@/lib/db/mongodb';

// Mock the database health check function
jest.mock('@/lib/db/mongodb', () => ({
  checkDatabaseHealth: jest.fn(),
}));

describe('Database Health Check API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/health/db', () => {
    it('should return 200 when database is healthy', async () => {
      const mockHealth = {
        status: 'healthy',
        latency: 50,
        metrics: {
          connections: 5,
          poolSize: 10,
          utilizationPercentage: 50
        },
        message: 'Database is responding normally'
      };

      (checkDatabaseHealth as jest.Mock).mockResolvedValue(mockHealth);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockHealth);
    });

    it('should return 503 when database is unhealthy', async () => {
      const mockHealth = {
        status: 'unhealthy',
        latency: -1,
        message: 'Database health check failed'
      };

      (checkDatabaseHealth as jest.Mock).mockResolvedValue(mockHealth);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data).toEqual(mockHealth);
    });

    it('should return 500 when health check throws an error', async () => {
      (checkDatabaseHealth as jest.Mock).mockRejectedValue(new Error('Connection failed'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        status: 'unhealthy',
        latency: -1,
        message: 'Failed to check database health: Connection failed'
      });
    });
  });

  describe('OPTIONS /api/health/db', () => {
    it('should return correct CORS headers', async () => {
      const response = await OPTIONS();

      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, OPTIONS');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization');
      expect(response.headers.get('Access-Control-Max-Age')).toBe('86400');
    });
  });
});