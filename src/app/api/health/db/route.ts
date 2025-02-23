import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/db/mongodb';
import { rateLimit } from '@/middleware/rate-limit';

// Add rate limiting to prevent abuse
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500
});

export async function GET() {
  try {
    // Apply rate limiting
    await limiter.check(10, 'HEALTH_CHECK'); // 10 requests per minute

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
      // Log unhealthy state for monitoring
      console.error('Database health check failed:', health);
      return NextResponse.json(health, { 
        status: 503,
        headers: {
          ...headers,
          'Retry-After': '30'
        }
      });
    }
  } catch (error: any) {
    // Enhanced error handling with specific error types
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

    // Log error for monitoring
    console.error('Database health check error:', error);

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