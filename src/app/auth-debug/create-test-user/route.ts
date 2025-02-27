import { NextRequest, NextResponse } from 'next/server';
import { UserModel } from '@/models/user';
import { withConnection } from '@/lib/db/connection-fix'; // Using the fixed connection
import bcrypt from 'bcryptjs';

// Function to check if auth debug is allowed
function isAuthDebugAllowed(): boolean {
  // Allow in development mode always
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  // Check for explicit environment variable to enable in production/testing
  if (process.env.ALLOW_AUTH_DEBUG === 'true') {
    console.warn('[WARNING] Auth debug endpoints are enabled in production. This should only be used temporarily.');
    return true;
  }
  
  return false;
}

// This is a debug-only route that should NOT be used in production
export async function POST(request: NextRequest) {
  // Check if auth debug is allowed
  if (!isAuthDebugAllowed()) {
    return NextResponse.json({ 
      success: false,
      error: 'This endpoint is only available in development mode or when explicitly enabled with ALLOW_AUTH_DEBUG=true' 
    }, { status: 403 });
  }
  
  try {
    const { email, password, name } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ 
        success: false,
        error: 'Email and password are required' 
      }, { status: 400 });
    }
    
    // Check if a user with this email already exists
    const existingUser = await withConnection(async () => {
      return UserModel.findOne({ email: email.toLowerCase() });
    });
    
    if (existingUser) {
      return NextResponse.json({ 
        success: false,
        error: 'User already exists', 
        user: {
          id: existingUser._id.toString(),
          email: existingUser.email,
          name: existingUser.name
        }
      }, { status: 409 });
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create the user
    const newUser = await withConnection(async () => {
      return UserModel.create({
        email: email.toLowerCase(),
        name: name || email.split('@')[0],
        hashedPassword,
        roles: [{ id: '1', name: 'user' }],
        emailVerified: true,
        failedLoginAttempts: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });
    
    return NextResponse.json({
      success: true,
      user: {
        id: newUser._id.toString(),
        email: newUser.email,
        name: newUser.name
      }
    });
  } catch (error) {
    console.error('Error creating test user:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create test user',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
