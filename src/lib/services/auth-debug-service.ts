/**
 * Auth Debug Service
 * 
 * This module provides service functions for authentication debugging purposes.
 * It helps diagnose issues with login and user management.
 * 
 * NOTE: These functions should only be used in development or when explicitly enabled for debugging.
 */

import { withConnection } from '@/lib/db/simplified-connection';
import { withErrorHandling } from '@/lib/db/unified-error-handler';
import { UserModel } from '@/models/user';
import { loadEnvVars } from '@/lib/db/env-debug';

// Load environment variables
loadEnvVars();

/**
 * Environment information response
 */
export interface EnvironmentInfo {
  isDevelopment: boolean;
  authDebugEnabled: boolean;
}

/**
 * Test user creation response
 */
export interface TestUserResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
  };
  error?: string;
  isDebugAllowed: boolean;
}

/**
 * Auth debugging response
 */
export interface AuthDebugResponse {
  success: boolean;
  timestamp: string;
  session: {
    exists: boolean;
    user: {
      id: string;
      email: string;
      name: string;
    } | null;
  };
  database: {
    status: string;
    error: string | null;
    info: {
      userCount: number;
      users: Array<{
        id: string;
        email: string;
        name: string;
        createdAt: Date;
      }> | null;
    } | null;
  };
  environment: {
    NODE_ENV: string;
    MONGODB_URI: string;
    NEXTAUTH_URL: string;
    NEXTAUTH_SECRET: string;
  };
  error?: string;
}

/**
 * Check if debugging is allowed
 * 
 * @returns Whether debugging is allowed
 */
function isDebugAllowed(): boolean {
  return process.env.NODE_ENV === 'development' || process.env.ALLOW_AUTH_DEBUG === 'true';
}

/**
 * Get environment information
 * 
 * @returns Environment information
 */
export async function checkEnvironment(): Promise<EnvironmentInfo> {
  return {
    isDevelopment: process.env.NODE_ENV === 'development',
    authDebugEnabled: process.env.ALLOW_AUTH_DEBUG === 'true',
  };
}

/**
 * Create a test user for debugging purposes
 * Only allowed in development or when explicitly enabled
 * 
 * @param email - Email for test user
 * @param password - Password for test user
 * @param name - Name for test user
 * @returns Information about the created test user
 */
export async function createTestUser(
  email: string,
  password: string,
  name: string
): Promise<TestUserResponse> {
  // Only allow in development or if explicitly enabled
  if (!isDebugAllowed()) {
    return {
      success: false,
      error: 'Auth debugging is not available in production unless enabled via ALLOW_AUTH_DEBUG',
      isDebugAllowed: false
    };
  }

  return withErrorHandling(async () => {
    return withConnection(async () => {
      // Check if user already exists
      const existingUser = await UserModel.findOne({ email }).lean().exec();
      
      if (existingUser) {
        return {
          success: false,
          error: 'A user with this email already exists',
          isDebugAllowed: true
        };
      }
      
      // Create the user with the provided details
      const newUser = await UserModel.create({
        email,
        password, // This will be hashed by the schema pre-save hook
        name
      });
      
      return {
        success: true,
        user: {
          id: newUser._id.toString(),
          email: newUser.email,
          name: newUser.name
        },
        isDebugAllowed: true
      };
    });
  }, 'createTestUser');
}

/**
 * Get detailed authentication debugging information
 * Only allowed in development or when explicitly enabled
 * 
 * @param session - The current user session if available
 * @returns Authentication debug information
 */
export async function getAuthDebugInfo(session: any): Promise<AuthDebugResponse> {
  // Only allow in development or if explicitly enabled
  if (!isDebugAllowed()) {
    return {
      success: false,
      timestamp: new Date().toISOString(),
      session: {
        exists: false,
        user: null
      },
      database: {
        status: 'unknown',
        error: null,
        info: null
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV || 'unknown',
        MONGODB_URI: '[hidden]',
        NEXTAUTH_URL: '[hidden]',
        NEXTAUTH_SECRET: '[hidden]'
      },
      error: 'Auth debugging is not available in production unless enabled via ALLOW_AUTH_DEBUG'
    };
  }

  return withErrorHandling(async () => {
    // Check MongoDB connection and count users
    let dbStatus = 'unknown';
    let userCount = 0;
    let connectionError = null;
    let databaseInfo = null;
    
    try {
      const users = await withConnection(async () => {
        return UserModel.find({});
      });
      
      userCount = users.length;
      dbStatus = 'connected';
      
      // Sanitize user data for security (remove sensitive fields)
      const sanitizedUsers = users.map(user => ({
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      }));
      
      databaseInfo = {
        userCount,
        // Only include sample users in development
        users: process.env.NODE_ENV === 'development' ? sanitizedUsers : null
      };
    } catch (error) {
      dbStatus = 'error';
      connectionError = error instanceof Error ? error.message : String(error);
    }
    
    // Collect environment information
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      MONGODB_URI: process.env.MONGODB_URI ? '[set]' : '[not set]',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ? '[set]' : '[not set]',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '[set]' : '[not set]'
    };
    
    return {
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
    };
  }, 'getAuthDebugInfo');
}
