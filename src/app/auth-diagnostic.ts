'use server'

import { CustomUser } from '@/types/auth';
import bcrypt from 'bcryptjs';
import { UserModel } from '@/models/user';
import mongoose from 'mongoose';
import { withConnection } from '@/lib/db/connection-fix'; // Using the fixed connection
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

/**
 * Safe serialize function to prevent circular references
 */
function safeSerialize(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  // Handle Mongoose document - convert to POJO
  if (obj.toObject && typeof obj.toObject === 'function') {
    return safeSerialize(obj.toObject());
  }
  
  // Handle MongoDB ObjectId
  if (obj instanceof mongoose.Types.ObjectId) {
    return obj.toString();
  }
  
  // Handle Date objects
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => safeSerialize(item));
  }
  
  // Handle objects
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      // Skip Mongoose document methods and private fields
      if (key.startsWith('$') || key.startsWith('_') && key !== '_id') {
        continue;
      }
      try {
        result[key] = safeSerialize(obj[key]);
      } catch (e) {
        // If serialization fails, use a placeholder
        result[key] = '[Circular or Unserializable]';
      }
    }
    return result;
  }
  
  // Return primitives as is
  return obj;
}

/**
 * This is a diagnostic version of the authenticateUser function
 * It adds extensive logging at each step to identify where authentication is failing
 */
export async function diagnoseMongo() {
  console.log('[DIAGNOSTIC] Starting MongoDB connection diagnostic');
  
  try {
    console.log('[DIAGNOSTIC] MongoDB URI:', maskUri(process.env.MONGODB_URI || ''));
    console.log('[DIAGNOSTIC] Environment:', process.env.NODE_ENV);
    
    // Check MongoDB connection directly
    console.log('[DIAGNOSTIC] Attempting direct Mongoose connection...');
    try {
      await mongoose.connect(process.env.MONGODB_URI || '');
      console.log('[DIAGNOSTIC] Direct connection successful!');
      
      // Check all collections
      const collections = await mongoose.connection.db.collections();
      console.log('[DIAGNOSTIC] Available collections:', collections.map(c => c.collectionName));
      
      // Count users
      const userCount = await mongoose.connection.db.collection('users').countDocuments();
      console.log('[DIAGNOSTIC] User count in database:', userCount);
      
      // Get a sample user (without showing sensitive data)
      const sampleUser = await mongoose.connection.db.collection('users').findOne({});
      if (sampleUser) {
        console.log('[DIAGNOSTIC] Sample user structure:');
        console.log('- ID:', sampleUser._id);
        console.log('- Email exists:', !!sampleUser.email);
        console.log('- Name exists:', !!sampleUser.name);
        console.log('- HashedPassword exists:', !!sampleUser.hashedPassword);
        console.log('- HashedPassword type:', typeof sampleUser.hashedPassword);
        console.log('- HashedPassword length:', sampleUser.hashedPassword?.length);
        console.log('- HashedPassword starts with:', sampleUser.hashedPassword?.substring(0, 10));
        console.log('- Roles:', JSON.stringify(sampleUser.roles));
      } else {
        console.log('[DIAGNOSTIC] No users found in the database.');
      }
      
      // Close connection
      await mongoose.disconnect();
      console.log('[DIAGNOSTIC] Connection closed.');
    } catch (error) {
      console.error('[DIAGNOSTIC] Direct connection failed:', error);
    }
    
    return {
      success: true,
      message: 'Diagnostics complete. Check server logs for results.'
    };
  } catch (error) {
    console.error('[DIAGNOSTIC] Error running diagnostics:', error);
    return {
      success: false,
      error: 'Failed to run diagnostics. Check server logs.'
    };
  }
}

export async function diagnoseAuth(email: string, password: string): Promise<any> {
  console.log('[DIAGNOSTIC] Starting authentication diagnosis');
  
  try {
    console.log(`[DIAGNOSTIC] Testing auth for email: ${email}`);
    
    // Track timing
    const startTime = Date.now();
    
    // Test connection with withConnection helper
    console.log('[DIAGNOSTIC] Testing connection with withConnection...');
    let connectionTest;
    try {
      connectionTest = await withConnection(async () => {
        return 'Connection successful';
      });
      console.log('[DIAGNOSTIC] withConnection test result:', connectionTest);
    } catch (error) {
      console.error('[DIAGNOSTIC] withConnection failed:', error);
      return {
        success: false,
        error: {
          code: 'connection_error',
          message: `Connection failed: ${error instanceof Error ? error.message : String(error)}`
        }
      };
    }
    
    console.log('[DIAGNOSTIC] Looking up user in database...');
    const user = await withConnection(async () => {
      return UserModel.findOne({ email: email.toLowerCase() });
    });
    
    console.log('[DIAGNOSTIC] User lookup completed in', Date.now() - startTime, 'ms');
    
    if (!user) {
      console.log(`[DIAGNOSTIC] No user found with email: ${email}`);
      
      // Check if any users exist to verify collection is accessible
      const userCount = await withConnection(async () => {
        return UserModel.countDocuments();
      });
      
      console.log(`[DIAGNOSTIC] Total users in database: ${userCount}`);
      
      return {
        success: false,
        error: {
          code: 'user_not_found',
          message: 'No account found with this email'
        }
      };
    }
    
    console.log(`[DIAGNOSTIC] User found: id=${user._id}, name="${user.name}"`);
    console.log(`[DIAGNOSTIC] Password hash exists: ${!!user.hashedPassword}`);
    
    if (!user.hashedPassword) {
      console.log('[DIAGNOSTIC] User has no password hash!');
      return {
        success: false,
        error: {
          code: 'invalid_user_data',
          message: 'User account is missing password data'
        }
      };
    }
    
    // Check if password hash looks valid
    const validHashFormat = user.hashedPassword.startsWith('$2') && user.hashedPassword.length >= 50;
    console.log(`[DIAGNOSTIC] Password hash format looks valid: ${validHashFormat}`);
    console.log(`[DIAGNOSTIC] Password hash: ${user.hashedPassword.substring(0, 10)}...`);
    
    // Test provided password
    console.log('[DIAGNOSTIC] Testing password comparison...');
    const bcryptStartTime = Date.now();
    
    let isValid;
    try {
      isValid = await bcrypt.compare(password, user.hashedPassword);
      console.log(`[DIAGNOSTIC] Password comparison completed in ${Date.now() - bcryptStartTime}ms`);
      console.log(`[DIAGNOSTIC] Password match result: ${isValid}`);
    } catch (error) {
      console.error('[DIAGNOSTIC] bcrypt.compare error:', error);
      return {
        success: false,
        error: {
          code: 'password_check_error',
          message: 'Error verifying password'
        }
      };
    }
    
    if (!isValid) {
      // Try a different password to check if bcrypt is working correctly
      const testPass = 'testpassword123';
      console.log(`[DIAGNOSTIC] Testing with known password "${testPass}" (for diagnostic purposes only)`);
      
      // Generate a new hash with the test password for comparison
      const testHash = await bcrypt.hash(testPass, 10);
      console.log(`[DIAGNOSTIC] Generated test hash: ${testHash.substring(0, 10)}...`);
      
      // Compare the test password with the new hash
      const testCompare = await bcrypt.compare(testPass, testHash);
      console.log(`[DIAGNOSTIC] Test password comparison result: ${testCompare}`);
      
      return {
        success: false,
        error: {
          code: 'invalid_credentials',
          message: 'Incorrect password'
        }
      };
    }
    
    // User authenticated successfully!
    console.log(`[DIAGNOSTIC] Authentication successful for ${email}`);
    
    // Use safe serialization to avoid circular references
    const userData = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      roles: safeSerialize(user.roles)
    };
    
    console.log('[DIAGNOSTIC] User data being returned:', JSON.stringify(userData, null, 2));
    
    return {
      success: true,
      data: userData
    };
    
  } catch (error) {
    console.error('[DIAGNOSTIC] Error during diagnosis:', error);
    
    return {
      success: false,
      error: {
        code: 'diagnosis_error',
        message: `Diagnosis failed: ${error instanceof Error ? error.message : String(error)}`
      }
    };
  }
}

// Helper to mask sensitive parts of the URI for logging
function maskUri(uri: string): string {
  if (!uri) return 'Not provided';
  
  try {
    const url = new URL(uri);
    
    // Mask username and password if present
    if (url.username || url.password) {
      url.username = url.username ? '***' : '';
      url.password = url.password ? '***' : '';
    }
    
    return url.toString();
  } catch (e) {
    // If URI is not valid URL, just show protocol and mask the rest
    if (uri.includes('://')) {
      const parts = uri.split('://');
      return `${parts[0]}://***`;
    }
    return '***';
  }
}
