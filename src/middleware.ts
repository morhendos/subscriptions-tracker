import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createRateLimit } from './middleware/rate-limit';
import { getToken } from 'next-auth/jwt';

// Protected routes that require authentication
const PROTECTED_ROUTES = [
  '/subscriptions',
  '/profile',
  '/settings',
  '/dashboard',
];

// Public routes that are always accessible
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/api/auth',
  '/error',
  '/about',
];

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

  // Get the path from the URL
  const path = request.nextUrl.pathname;
  
  // Check if the route requires authentication
  const isProtectedRoute = PROTECTED_ROUTES.some(route => path.startsWith(route));
  const isPublicRoute = PUBLIC_ROUTES.some(route => path.startsWith(route));
  const isApiRoute = path.startsWith('/api');
  
  // Handle protected routes - check authentication
  if (isProtectedRoute) {
    try {
      const token = await getToken({ req: request });
      
      // If no token, redirect to login
      if (!token) {
        const loginUrl = new URL('/login', request.url);
        
        // Add the original URL as a callback parameter
        loginUrl.searchParams.set('callbackUrl', request.url);
        
        return NextResponse.redirect(loginUrl);
      }
    } catch (error) {
      console.error('[Auth Middleware] Error verifying token:', error);
      
      // On error, redirect to login as a fallback
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Apply rate limiting based on route
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
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};