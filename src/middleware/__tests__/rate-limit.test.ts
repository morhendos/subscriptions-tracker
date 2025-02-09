import { createRateLimit, cleanupRateLimitStore } from '../rate-limit';
import { NextRequest } from 'next/server';

// Mock NextRequest
const createMockRequest = (ip: string) => {
  return {
    ip,
    headers: new Headers()
  } as NextRequest;
};

describe('Rate Limiting Middleware', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    cleanupRateLimitStore();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should allow requests within rate limit', async () => {
    const rateLimit = createRateLimit({ maxRequests: 2, windowMs: 1000 });
    const request = createMockRequest('127.0.0.1');

    // First request
    const response1 = await rateLimit(request);
    expect(response1).toBeNull();

    // Second request
    const response2 = await rateLimit(request);
    expect(response2).toBeNull();
  });

  it('should block requests exceeding rate limit', async () => {
    const rateLimit = createRateLimit({ maxRequests: 2, windowMs: 1000 });
    const request = createMockRequest('127.0.0.1');

    // Make two allowed requests
    await rateLimit(request);
    await rateLimit(request);

    // Third request should be blocked
    const response = await rateLimit(request);
    expect(response?.status).toBe(429);

    const data = await response?.json();
    expect(data).toEqual(expect.objectContaining({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded'
    }));
  });

  it('should reset rate limit after window expires', async () => {
    const windowMs = 1000;
    const rateLimit = createRateLimit({ maxRequests: 1, windowMs });
    const request = createMockRequest('127.0.0.1');

    // First request
    const response1 = await rateLimit(request);
    expect(response1).toBeNull();

    // Second request within window should be blocked
    const response2 = await rateLimit(request);
    expect(response2?.status).toBe(429);

    // Advance time beyond window
    jest.advanceTimersByTime(windowMs + 100);

    // Request after window should be allowed
    const response3 = await rateLimit(request);
    expect(response3).toBeNull();
  });

  it('should track different IPs separately', async () => {
    const rateLimit = createRateLimit({ maxRequests: 1, windowMs: 1000 });
    const request1 = createMockRequest('127.0.0.1');
    const request2 = createMockRequest('127.0.0.2');

    // First IP's requests
    const response1 = await rateLimit(request1);
    expect(response1).toBeNull();
    const response2 = await rateLimit(request1);
    expect(response2?.status).toBe(429);

    // Second IP's request should be allowed
    const response3 = await rateLimit(request2);
    expect(response3).toBeNull();
  });

  it('should set correct rate limit headers', async () => {
    const rateLimit = createRateLimit({ maxRequests: 5, windowMs: 1000 });
    const request = createMockRequest('127.0.0.1');

    // Make a request
    const response = await rateLimit(request);
    expect(response).toBeNull();

    // For successful response, we can't check headers directly
    // In real application, these headers would be merged with the final response

    // Make requests until blocked
    for (let i = 0; i < 5; i++) {
      await rateLimit(request);
    }

    const blockedResponse = await rateLimit(request);
    expect(blockedResponse?.headers.get('X-RateLimit-Limit')).toBe('5');
    expect(blockedResponse?.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(blockedResponse?.headers.get('Retry-After')).toBeDefined();
  });

  it('should cleanup expired entries', async () => {
    const windowMs = 1000;
    const rateLimit = createRateLimit({ maxRequests: 1, windowMs });
    const request = createMockRequest('127.0.0.1');

    // Make initial request
    await rateLimit(request);

    // Advance time beyond window
    jest.advanceTimersByTime(windowMs + 100);

    // Cleanup
    cleanupRateLimitStore();

    // Request should be allowed after cleanup
    const response = await rateLimit(request);
    expect(response).toBeNull();
  });
});