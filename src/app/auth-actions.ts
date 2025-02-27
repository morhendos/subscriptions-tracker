'use server'

import { CustomUser } from '@/types/auth';
import bcrypt from 'bcryptjs';
import { UserModel } from '@/models/user';
import { withConnection, safeSerialize } from '@/lib/db/simplified-connection';
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
    roles: safeSerialize(user.roles)
  };
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    // Find the user
    const user = await withConnection(async () => {
      return UserModel.findOne({ email: email.toLowerCase() });
    });
    
    if (!user) {
      return {
        success: false,
        error: {
          code: 'invalid_credentials',
          message: 'No account found with this email. Please check your email or create a new account.'
        }
      };
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.hashedPassword);
    if (!isValid) {
      return {
        success: false,
        error: {
          code: 'invalid_credentials',
          message: 'Incorrect password. Please try again.'
        }
      };
    }
    
    return {
      success: true,
      data: serializeUser(user)
    };
  } catch (error) {
    console.error('Authentication error:', error);
    
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
    // Check if user exists
    const existingUser = await withConnection(async () => {
      return UserModel.findOne({ email: email.toLowerCase() });
    });
    
    if (existingUser) {
      return {
        success: false,
        error: {
          code: 'email_exists',
          message: 'This email is already registered. Please use a different email or log in.'
        }
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
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
    
    return {
      success: true,
      data: serializeUser(user)
    };
  } catch (error) {
    console.error('Registration error:', error);
    
    return {
      success: false,
      error: {
        code: 'server_error',
        message: 'An unexpected error occurred during registration. Please try again.'
      }
    };
  }
}
