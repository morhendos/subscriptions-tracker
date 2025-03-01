/**
 * Authentication Debugging API Route
 * 
 * This route provides detailed information about the authentication system
 * to help diagnose issues with login and user management.
 * 
 * NOTE: This route is only accessible in development mode by default.
 * It can be enabled in production by setting ALLOW_AUTH_DEBUG=true.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthDebugInfo } from "@/lib/services/auth-debug-service";

export async function GET(request: NextRequest) {
  try {
    // Get current session (if any)
    const session = await getServerSession();
    
    // Use auth debug service to get debug information
    const debugInfo = await getAuthDebugInfo(session);
    
    return NextResponse.json(debugInfo, {
      status: debugInfo.success ? 200 : 403
    });
  } catch (error) {
    console.error("Auth debug API error:", error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
