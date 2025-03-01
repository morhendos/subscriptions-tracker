import { NextRequest, NextResponse } from 'next/server';
import { checkEnvironment } from '@/lib/services/auth-debug-service';

/**
 * API endpoint to check if we're in development mode or if auth debug is enabled
 * This helps the client-side code determine whether to show debug tools
 */
export async function GET(request: NextRequest) {
  // Get environment information from the auth-debug service
  const environmentInfo = await checkEnvironment();
  
  // Return environment information without exposing sensitive data
  return NextResponse.json(environmentInfo);
}
