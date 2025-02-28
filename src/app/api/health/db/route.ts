/**
 * Database Health Check API
 * 
 * Provides a simple API endpoint to check database connectivity and health.
 * Uses the connection manager to verify MongoDB connection status.
 */

import { NextResponse } from 'next/server';
import { MongoConnectionManager } from '@/lib/db/connection-manager';
import { withErrorHandling, createErrorResponse } from '@/lib/db/unified-error-handler';

export async function GET() {
  try {
    // Get the connection manager singleton
    const connectionManager = MongoConnectionManager.getInstance();
    
    // Use our error handling wrapper around the health check
    const healthCheck = await withErrorHandling(
      () => connectionManager.checkHealth(),
      'health/db'
    );
    
    // Return a healthy response with connection details
    return NextResponse.json({
      status: healthCheck.status,
      connection: {
        latency: healthCheck.latency,
        readyState: healthCheck.details?.readyState || 'unknown',
      },
      timestamp: new Date().toISOString(),
    }, { status: healthCheck.status === 'healthy' ? 200 : 503 });
  } catch (error) {
    // Use our standardized error response
    const errorResponse = createErrorResponse(error);
    
    return NextResponse.json({
      status: 'unhealthy',
      error: errorResponse.error,
      code: errorResponse.code,
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}
