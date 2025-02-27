import { NextRequest, NextResponse } from 'next/server';
import { headers as getHeaders } from 'next/headers';

interface RateLimitConfig {
  maxRequests: number;  // Maximum number of requests allowed within the window
  windowMs: number;     // Time window in milliseconds
}

interface RateLimitInfo {
  requests: number;     // Number of requests made
  startTime: number;    // Start time of the current window
}

// In-memory store for rate limiting
// In production, this should be replaced with Redis or similar
const rateLimitStore = new Map<string, RateLimitInfo>();

// Default configuration
const defaultConfig: RateLimitConfig = {
  maxRequests: 100,     // 100 requests
  windowMs: 60 * 1000,  // per minute
};

/**
 * Creates a rate limiting middleware
 * @param config Rate limiting configuration
 */
export function createRateLimit(config: Partial<RateLimitConfig> = {}) {
  const { maxRequests, windowMs } = { ...defaultConfig, ...config };

  return async function rateLimit(request: NextRequest) {
    // Skip rate limiting for non-production environments unless forced
    if (process.env.NODE_ENV !== 'production' && !process.env.FORCE_RATE_LIMIT) {
      return null;
    }
    
    const headersList = getHeaders();
    
    // Get client identifier (IP address or API key)
    const clientId = request.ip || 
                    headersList.get('x-forwarded-for') || 
                    headersList.get('x-real-ip') ||
                    'unknown';

    // Skip rate limiting for development hosts
    const host = request.headers.get('host') || '';
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      return null;
    }

    const now = Date.now();
    const rateLimitInfo = rateLimitStore.get(clientId) || { requests: 0, startTime: now };

    // Reset if window has expired
    if (now - rateLimitInfo.startTime > windowMs) {
      rateLimitInfo.requests = 0;
      rateLimitInfo.startTime = now;
    }

    // Increment request count
    rateLimitInfo.requests++;

    // Update store
    rateLimitStore.set(clientId, rateLimitInfo);

    // Calculate remaining requests and reset time
    const remaining = Math.max(0, maxRequests - rateLimitInfo.requests);
    const reset = Math.ceil((rateLimitInfo.startTime + windowMs - now) / 1000);

    // Set rate limit headers
    const responseHeaders = {
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': reset.toString(),
    };

    // Check if rate limit exceeded
    if (rateLimitInfo.requests > maxRequests) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded',
          retryAfter: reset
        }),
        {
          status: 429,
          headers: {
            ...responseHeaders,
            'Content-Type': 'application/json',
            'Retry-After': reset.toString()
          }
        }
      );
    }

    return null;
  };
}

/**
 * Cleans up expired rate limit entries
 * Should be called periodically in production
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  // Convert to array first to avoid iteration issues
  const entries = Array.from(rateLimitStore);
  
  entries.forEach(([clientId, info]) => {
    if (now - info.startTime > defaultConfig.windowMs) {
      rateLimitStore.delete(clientId);
    }
  });
}

// Automatically cleanup every minute
if (process.env.NODE_ENV === 'production') {
  setInterval(cleanupRateLimitStore, 60 * 1000);
}