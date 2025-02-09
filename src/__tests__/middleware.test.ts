import { middleware } from '../middleware';
import { NextRequest, NextResponse } from 'next/server';

// Mock Next.js objects
jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server');
  return {
    ...originalModule,
    NextResponse: {
      next: jest.fn(() => ({
        headers: new Headers()
      })),
      json: jest.fn((body, init) => ({
        ...new originalModule.NextResponse(),
        ...init,
        body,
        headers: new Headers(init?.headers)
      }))
    }
  };
});

describe('Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const createMockRequest = (path: string, method = 'GET', ip = '127.0.0.1') => {
    return {
      ip,
      method,
      nextUrl: { pathname: path },
      headers: new Headers()
    } as unknown as NextRequest;
  };

  describe('CORS Handling', () => {
    it('should handle OPTIONS requests correctly', async () => {
      const request = createMockRequest('/api/health', 'OPTIONS');
      const response = await middleware(request);

      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, PUT, DELETE, OPTIONS');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization, X-API-Key');
    });

    it('should add CORS headers to non-OPTIONS requests', async () => {
      const request = createMockRequest('/api/health');
      const response = await middleware(request);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, PUT, DELETE, OPTIONS');
    });
  });

  describe('Security Headers', () => {
    it('should add security headers to all responses', async () => {
      const request = createMockRequest('/api/health');
      const response = await middleware(request);

      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
      expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
      expect(response.headers.get('Strict-Transport-Security')).toBe('max-age=31536000; includeSubDomains');
    });
  });

  describe('Rate Limiting', () => {
    describe('Health Endpoint', () => {
      it('should allow requests within rate limit', async () => {
        const request = createMockRequest('/api/health');
        const response = await middleware(request);

        expect(response.status).not.toBe(429);
      });

      it('should block requests exceeding rate limit', async () => {
        const request = createMockRequest('/api/health');
        
        // Make requests up to the limit
        for (let i = 0; i < 121; i++) {
          await middleware(request);
        }

        const response = await middleware(request);
        const data = await response.json();

        expect(response.status).toBe(429);
        expect(data.error).toBe('Too Many Requests');
      });
    });

    describe('API Endpoints', () => {
      it('should apply stricter rate limits to API endpoints', async () => {
        const request = createMockRequest('/api/subscriptions');
        
        // Make requests up to the limit
        for (let i = 0; i < 61; i++) {
          await middleware(request);
        }

        const response = await middleware(request);
        expect(response.status).toBe(429);
      });

      it('should track different endpoints separately', async () => {
        const request1 = createMockRequest('/api/subscriptions');
        const request2 = createMockRequest('/api/health');

        // Max out subscription endpoint
        for (let i = 0; i < 61; i++) {
          await middleware(request1);
        }

        // Health endpoint should still work
        const response = await middleware(request2);
        expect(response.status).not.toBe(429);
      });
    });

    describe('Auth Endpoints', () => {
      it('should apply most restrictive rate limits to auth endpoints', async () => {
        const request = createMockRequest('/api/auth/login');
        
        // Make requests up to the limit
        for (let i = 0; i < 31; i++) {
          await middleware(request);
        }

        const response = await middleware(request);
        expect(response.status).toBe(429);
      });

      it('should reset rate limit after window expires', async () => {
        const request = createMockRequest('/api/auth/login');
        
        // Max out the limit
        for (let i = 0; i < 31; i++) {
          await middleware(request);
        }

        // Advance time beyond the window
        jest.advanceTimersByTime(60 * 1000 + 100);

        // Should be allowed again
        const response = await middleware(request);
        expect(response.status).not.toBe(429);
      });
    });
  });

  describe('Route Matching', () => {
    it('should not apply middleware to non-API routes', async () => {
      const request = createMockRequest('/about');
      const response = await middleware(request);

      // Middleware should pass through
      expect(NextResponse.next).toHaveBeenCalled();
    });

    it('should apply middleware to all API routes', async () => {
      const apiPaths = [
        '/api/health',
        '/api/subscriptions',
        '/api/auth/login',
        '/api/users/profile'
      ];

      for (const path of apiPaths) {
        const request = createMockRequest(path);
        await middleware(request);
        
        // Should add security headers
        const response = await middleware(request);
        expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      }
    });
  });
});