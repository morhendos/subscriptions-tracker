import { NextRequest, NextResponse } from 'next/server';
import { UserModel } from '@/models/user';
import { withConnection } from '@/lib/db';
import bcrypt from 'bcryptjs';

// This is a debug-only route that should NOT be used in production
export async function POST(request: NextRequest) {
  // Only allow in development mode
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'This endpoint is only available in development mode' }, { status: 403 });
  }
  
  try {
    const { email, password, name } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }
    
    // Check if a user with this email already exists
    const existingUser = await withConnection(async () => {
      return UserModel.findOne({ email: email.toLowerCase() });
    });
    
    if (existingUser) {
      return NextResponse.json({ 
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
      error: 'Failed to create test user',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
