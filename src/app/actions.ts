'use server'

import { AuthError } from '@/lib/auth/validation';
import { CustomUser } from '@/types/auth';
import bcrypt from 'bcryptjs';
import { UserModel } from '@/models/user';

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function comparePasswords(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<CustomUser> {
  try {
    // Find user by email
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      throw new AuthError('No account found with this email. Please check your email or create a new account.', 'invalid_credentials');
    }

    // Verify password
    const isValid = await comparePasswords(password, user.hashedPassword);
    if (!isValid) {
      throw new AuthError('Incorrect password. Please try again.', 'invalid_credentials');
    }

    // Convert to CustomUser format
    const customUser: CustomUser = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      roles: user.roles
    };

    return customUser;
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    console.error('Authentication error:', error);
    throw new AuthError('Something went wrong. Please try again.', 'invalid_credentials');
  }
}

export async function registerUser(
  email: string,
  password: string,
  name?: string
): Promise<CustomUser> {
  try {
    // Check if user exists
    const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new AuthError('This email is already registered. Please use a different email or log in.', 'email_exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await UserModel.create({
      email: email.toLowerCase(),
      name: name || email.split('@')[0],
      hashedPassword,
      roles: [{ id: '1', name: 'user' }]
    });

    // Convert to CustomUser format
    const customUser: CustomUser = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      roles: user.roles
    };

    return customUser;
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    console.error('Registration error:', error);
    throw new AuthError('Failed to create account. Please try again.', 'registration_failed');
  }
}