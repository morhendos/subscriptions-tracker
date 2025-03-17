import { NextRequest, NextResponse } from 'next/server';
import { withAuthConnection } from '@/lib/db/auth-connection';
import { UserModel } from '@/models/user';
import { createRole } from '@/utils/auth';

export async function POST(request: NextRequest) {
  try {
    // Only allow this in development or testing environment
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { message: 'This endpoint is not available in production' },
        { status: 403 }
      );
    }
    
    // Parse the request body
    const body = await request.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Update the user in the database
    const result = await withAuthConnection(async () => {
      // Find the user by email
      const user = await UserModel.findOne({ email: email.toLowerCase() }).exec();
      
      if (!user) {
        throw new Error(`User not found with email: ${email}`);
      }
      
      // Check if user already has admin role
      const hasAdminRole = user.roles.some(role => role.name === 'admin');
      
      if (hasAdminRole) {
        return { message: 'User already has admin role', updated: false };
      }
      
      // Add the admin role to the user
      user.roles.push(createRole('2', 'admin'));
      
      // Save the updated user
      await user.save();
      
      return { 
        message: 'Admin role added successfully', 
        updated: true,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          roles: user.roles
        } 
      };
    });
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error adding admin role:', error);
    
    return NextResponse.json(
      { message: error.message || 'Failed to add admin role' },
      { status: 500 }
    );
  }
}
