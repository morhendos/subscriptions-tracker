import { NextResponse } from 'next/server';
import { getSystemHealth } from '@/lib/services/health-service';
import { createErrorResponse } from '@/lib/db/unified-error-handler';

/**
 * Overall system health check endpoint
 * Provides health information about system components including database and schema
 */
export async function GET() {
  try {
    // Use health service to get system health information
    const healthData = await getSystemHealth();
    
    return NextResponse.json(healthData);
  } catch (error) {
    // Use the unified error handler
    const errorResponse = createErrorResponse(error, process.env.NODE_ENV === 'development');
    
    console.error('[Health Check] Error:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: errorResponse.error,
        code: errorResponse.code,
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' ? { details: errorResponse.details } : {})
      },
      { status: 500 }
    );
  }
}
