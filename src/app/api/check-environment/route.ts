import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint to check if we're in development mode or if auth debug is enabled
 * This helps the client-side code determine whether to show debug tools
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    isDevelopment: process.env.NODE_ENV === 'development',
    authDebugEnabled: process.env.ALLOW_AUTH_DEBUG === 'true',
    // Don't expose any sensitive information or actual environment variables here
  });
}
