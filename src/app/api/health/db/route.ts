import { NextRequest, NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/db/mongodb';
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

  try {
    const health = await checkDatabaseHealth();
    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    };
    
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