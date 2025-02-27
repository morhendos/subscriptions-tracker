'use server'

// This is a fixed version of the authentication actions
// It uses the simplified connection manager to avoid premature disconnections

import { CustomUser } from '@/types/auth';
import bcrypt from 'bcryptjs';
import { UserModel } from '@/models/user';
import { withConnection } from '@/lib/db/connection-fix';
import { loadEnvVars, ensureEnvVars } from '@/lib/db/env-debug';

// Load env vars at the module level to ensure they're available
loadEnvVars();
ensureEnvVars();

interface AuthResult {
  success: boolean;
  data?: CustomUser;
  error?: {
    code: string;
    message: string;
  };
}

function serializeUser(user: any): CustomUser {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    roles: user.roles.map((role: any) => ({
      id: role.id,
      name: role.name
    }))
  };
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    console.log(`[AUTH FIX] Authenticating user: ${email}`);
    
    // Find the user
    const user = await withConnection(async () => {
      return UserModel.findOne({ email: email.toLowerCase() });
    });
    
    if (!user) {
      console.log(`[AUTH FIX] No user found with email: ${email}`);
      return {
        success: false,
        error: {
          code: 'invalid_credentials',
          message: 'No account found with this email. Please check your email or create a new account.'
        }
      };
    }

    console.log(`[AUTH FIX] User found, verifying password for: ${email}`);
    
    // Verify password
    const isValid = await bcrypt.compare(password, user.hashedPassword);
    if (!isValid) {
      console.log(`[AUTH FIX] Invalid password for: ${email}`);
      return {
        success: false,
        error: {
          code: 'invalid_credentials',
          message: 'Incorrect password. Please try again.'
        }
      };
    }

    console.log(`[AUTH FIX] Authentication successful for: ${email}`);
    
    return {
      success: true,
      data: serializeUser(user)
    };
  } catch (error) {
    console.error('[AUTH FIX] Authentication error:', error);
    
    return {
      success: false,
      error: {
        code: 'server_error',
        message: 'An unexpected error occurred. Please try again.'
      }
    };
  }
}

export async function registerUser(
  email: string,
  password: string,
  name?: string
): Promise<AuthResult> {
  try {
    console.log('[AUTH FIX] Starting user registration for:', email);
    
    // Check if user exists
    const existingUser = await withConnection(async () => {
      return UserModel.findOne({ email: email.toLowerCase() });
    });
    
    if (existingUser) {
      console.log('[AUTH FIX] User already exists with email:', email);
      return {
        success: false,
        error: {
          code: 'email_exists',
          message: 'This email is already registered. Please use a different email or log in.'
        }
      };
    }

    // Hash password
    console.log('[AUTH FIX] Hashing password');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    console.log('[AUTH FIX] Creating new user');
    const user = await withConnection(async () => {
      return UserModel.create({
        email: email.toLowerCase(),
        name: name || email.split('@')[0],
        hashedPassword,
        roles: [{ id: '1', name: 'user' }],
        emailVerified: false,
        failedLoginAttempts: 0
      });
    });
    
    console.log('[AUTH FIX] User created successfully with ID:', user._id);
    
    return {
      success: true,
      data: serializeUser(user)
    };
  } catch (error) {
    console.error('[AUTH FIX] Registration error:', error);
    
    return {
      success: false,
      error: {
        code: 'server_error',
        message: 'An unexpected error occurred during registration. Please try again.'
      }
    };
  }
}
