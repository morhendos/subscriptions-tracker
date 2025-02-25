'use server'

import { CustomUser } from '@/types/auth';
import bcrypt from 'bcryptjs';
import { UserModel } from '@/models/user';
import mongoose from 'mongoose';
import { getAtlasConfig } from '@/lib/db/atlas-config';
import { normalizeMongoURI } from '@/lib/db/mongodb';

interface AuthResult {
  success: boolean;
  data?: CustomUser;
  error?: {
    code: string;
    message: string;
  };
}

// Interface for MongoDB validation errors
interface ValidationError {
  name: string;
  errors: {
    [key: string]: {
      message: string;
    }
  }
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function comparePasswords(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
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

// Direct connection to MongoDB without using cached connection
async function createDirectConnection(): Promise<mongoose.Connection> {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not defined');
  }

  // Get Atlas configuration
  const atlasConfig = getAtlasConfig(process.env.NODE_ENV);
  
  // Log the sanitized URI (hiding credentials)
  const sanitizedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//[username]:[hidden]@');
  console.log('Attempting direct MongoDB connection to:', sanitizedUri);
  
  // Use the normalizeMongoURI function to ensure proper database name
  const dbName = 'subscriptions';
  const normalizedUri = normalizeMongoURI(uri, dbName);
  
  console.log('Connecting with properly formatted database URI');
  
  try {
    // Connect with a direct connection, not using the cached connection
    const mongooseInstance = await mongoose.connect(normalizedUri, {
      ...atlasConfig,
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      connectTimeoutMS: 10000, // 10 second timeout
    });
    
    console.log('Direct MongoDB connection established successfully!');
    
    if (!mongooseInstance.connection.db) {
      throw new Error('Database connection not fully established');
    }
    
    return mongooseInstance.connection;
  } catch (error) {
    console.error('Direct MongoDB connection failed with error:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    let connection: mongoose.Connection | null = null;
    
    try {
      // Use direct connection instead of cached
      connection = await createDirectConnection();
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return {
        success: false,
        error: {
          code: 'db_connection_error',
          message: 'Unable to connect to database. Please try again later.'
        }
      };
    }

    // Find user by email
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    
    // Close the direct connection
    if (connection) {
      await mongoose.disconnect();
    }
    
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
    const isValid = await comparePasswords(password, user.hashedPassword);
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
  let connection: mongoose.Connection | null = null;
  
  try {
    console.log('Starting user registration process for email:', email);
    
    // Establish direct MongoDB connection (not cached)
    try {
      connection = await createDirectConnection();
      console.log('Database connection successful for registration');
    } catch (dbError) {
      console.error('Database connection failed during registration:', dbError);
      return {
        success: false,
        error: {
          code: 'db_connection_error',
          message: 'Unable to connect to database. Please try again later.'
        }
      };
    }

    // Check if user exists
    console.log('Checking if user already exists');
    const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
    
    if (existingUser) {
      console.log('User already exists with this email');
      return {
        success: false,
        error: {
          code: 'email_exists',
          message: 'This email is already registered. Please use a different email or log in.'
        }
      };
    }

    // Hash password
    console.log('Hashing password');
    const hashedPassword = await hashPassword(password);

    // Create user with detailed logging
    console.log('Creating new user');
    try {
      const user = await UserModel.create({
        email: email.toLowerCase(),
        name: name || email.split('@')[0],
        hashedPassword,
        roles: [{ id: '1', name: 'user' }]
      });
      
      console.log('User created successfully with ID:', user._id);
      
      return {
        success: true,
        data: serializeUser(user)
      };
    } catch (error) {
      console.error('Error creating user:', error);
      // Check for specific validation errors
      if (error && typeof error === 'object' && 'name' in error) {
        const modelError = error as ValidationError;
        
        if (modelError.name === 'ValidationError' && modelError.errors) {
          const validationErrors = Object.keys(modelError.errors)
            .map(field => modelError.errors[field].message)
            .join('; ');
            
          return {
            success: false,
            error: {
              code: 'validation_error',
              message: `Validation failed: ${validationErrors}`
            }
          };
        }
      }
      
      throw error; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error('Registration error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 3).join('\n') : undefined,
      name: error instanceof Error ? error.name : 'Unknown',
      code: error instanceof Error && 'code' in error ? (error as any).code : undefined
    });
    
    return {
      success: false,
      error: {
        code: 'server_error',
        message: 'An unexpected error occurred during registration. Please try again.'
      }
    };
  } finally {
    // Always ensure we close the direct connection
    if (connection) {
      try {
        await mongoose.disconnect();
        console.log('Database connection closed after registration');
      } catch (error) {
        console.error('Error closing database connection:', error);
      }
    }
  }
}