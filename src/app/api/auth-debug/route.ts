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
import { withConnection } from "@/lib/db/simplified-connection";
import { UserModel, UserDocument } from "@/models/user";
import { loadEnvVars } from "@/lib/db/env-debug";

// Load environment variables
loadEnvVars();

// Check if debugging is allowed
const isDebugAllowed = process.env.NODE_ENV === "development" || process.env.ALLOW_AUTH_DEBUG === "true";

export async function GET(request: NextRequest) {
  // Only allow in development or if explicitly enabled
  if (!isDebugAllowed) {
    return NextResponse.json(
      { 
        success: false,
        error: "Auth debugging is not available in production unless enabled via ALLOW_AUTH_DEBUG",
        environment: process.env.NODE_ENV || "unknown",
        debugEnabled: false
      },
      { status: 403 }
    );
  }

  try {
    // Get current session (if any)
    const session = await getServerSession();
    
    // Check MongoDB connection and count users
    let dbStatus = "unknown";
    let userCount = 0;
    let connectionError = null;
    let databaseInfo = null;
    
    try {
      const users = await withConnection(async () => {
        // Using regular find() instead of lean() to ensure we get proper document types
        return UserModel.find({});
      });
      
      userCount = users.length;
      dbStatus = "connected";
      
      // Sanitize user data for security (remove sensitive fields)
      const sanitizedUsers = users.map(user => ({
        id: user._id.toString(), // This is now properly typed
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      }));
      
      databaseInfo = {
        userCount,
        // Only include sample users in development
        users: process.env.NODE_ENV === "development" ? sanitizedUsers : null
      };
    } catch (error) {
      dbStatus = "error";
      connectionError = error instanceof Error ? error.message : String(error);
    }
    
    // Collect environment information
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV || "not set",
      MONGODB_URI: process.env.MONGODB_URI ? "[set]" : "[not set]",
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ? "[set]" : "[not set]",
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "[set]" : "[not set]"
    };
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      session: {
        exists: !!session,
        user: session?.user ? {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name
        } : null
      },
      database: {
        status: dbStatus,
        error: connectionError,
        info: databaseInfo
      },
      environment: envInfo
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
