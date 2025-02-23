import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createRateLimit } from './middleware/rate-limit';

// Rate limit configuration for different endpoints
const rateLimitConfigs = {
  // Less restrictive for health checks
  health: {
    maxRequests: 120, // 2 requests per second
    windowMs: 60 * 1000, // 1 minute
  },
  // More restrictive for API endpoints
  api: {
    maxRequests: 60, // 1 request per second
    windowMs: 60 * 1000, // 1 minute
  },
  // Most restrictive for authentication endpoints
  auth: {
    maxRequests: 30, // 1 request per 2 seconds
    windowMs: 60 * 1000, // 1 minute
  },
};

// Create rate limiters
const healthRateLimit = createRateLimit(rateLimitConfigs.health);
const apiRateLimit = createRateLimit(rateLimitConfigs.api);
const authRateLimit = createRateLimit(rateLimitConfigs.auth);

// Configure CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
  'Access-Control-Max-Age': '86400',
};

export async function middleware(request: NextRequest) {
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { 
      status: 204,
      headers: corsHeaders
    });
  }

  // Add security headers
  const headers = {
    ...corsHeaders,
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  };

  // Apply rate limiting based on route
  const path = request.nextUrl.pathname;
  let rateLimitResponse = null;

  if (path.startsWith('/api/health')) {
    rateLimitResponse = await healthRateLimit(request);
  } else if (path.startsWith('/api/auth')) {
    rateLimitResponse = await authRateLimit(request);
  } else if (path.startsWith('/api')) {
    rateLimitResponse = await apiRateLimit(request);
  }

  // Return rate limit response if limit exceeded
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Continue with the request
  const response = NextResponse.next();

  // Add security headers to response
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

// Configure which routes should be handled by middleware
export const config = {
  matcher: [
    '/api/:path*',
    '/auth/:path*'
  ],
};