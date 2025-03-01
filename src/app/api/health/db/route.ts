/**
 * Database Health Check API
 * 
 * Provides a simple API endpoint to check database connectivity and health.
 * Uses the health service to verify MongoDB connection status.
 */

import { NextResponse } from 'next/server';
import { getDatabaseHealth } from '@/lib/services/health-service';
import { createErrorResponse } from '@/lib/db/unified-error-handler';

export async function GET() {
  try {
    // Use health service to get database health status
    const healthCheck = await getDatabaseHealth();
    
    // Return a response with the health status
    return NextResponse.json(
      healthCheck, 
      { status: healthCheck.status === 'healthy' ? 200 : 503 }
    );
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
