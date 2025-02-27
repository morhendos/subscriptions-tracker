import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseHealth, shouldSkipDatabaseConnection } from '@/lib/db';
import { createRateLimit } from '@/middleware/rate-limit';

// Add rate limiting to prevent abuse
const rateLimiter = createRateLimit({
  maxRequests: 10,    // 10 requests
  windowMs: 60 * 1000 // per minute
});

export async function GET(request: NextRequest) {
  // Check rate limit
  const rateLimitResponse = await rateLimiter(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Header constants for response
  const headers = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };

  // Provide mock health response during build
  if (shouldSkipDatabaseConnection()) {
    const mockHealth = {
      status: 'healthy',
      latency: 0,
      timestamp: new Date().toISOString(),
      message: 'Mock database health check - running in build environment',
      buildEnvironment: true
    };
    
    return NextResponse.json(mockHealth, { 
      status: 200, 
      headers 
    });
  }

  try {
    const health = await getDatabaseHealth();
    
    if (health.status === 'healthy') {
      return NextResponse.json(health, { 
        status: 200,
        headers
      });
    } else {
      return NextResponse.json(health, { 
        status: 503,
        headers: {
          ...headers,
          'Retry-After': '30'
        }
      });
    }
  } catch (error: any) {
    const errorResponse = {
      status: 'unhealthy',
      latency: -1,
      timestamp: new Date().toISOString(),
      error: {
        type: error.name || 'UnknownError',
        message: `Failed to check database health: ${error.message}`,
        code: error.code || 'UNKNOWN',
      }
    };

    return NextResponse.json(errorResponse, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store',
        'Retry-After': '60'
      }
    });
  }
}

// Add OPTIONS method for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}