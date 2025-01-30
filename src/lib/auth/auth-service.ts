import { AuthError } from './validation';
import { CustomUser } from '@/types/auth';
import { getStorageProvider } from '@/lib/storage';

interface StoredUser extends Omit<CustomUser, 'id'> {
  id: string;
  hashedPassword: string;
}

const USERS_STORAGE_KEY = 'st_users';

function generateUserId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function hashPassword(password: string): string {
  // In a real app, use bcrypt or similar
  return Buffer.from(password).toString('base64');
}

function comparePasswords(plain: string, hashed: string): boolean {
  return hashPassword(plain) === hashed;
}

async function getStoredUsers(providedUsersJson?: string): Promise<StoredUser[]> {
  // For development/testing purposes
  if (providedUsersJson) {
    try {
      return JSON.parse(providedUsersJson);
    } catch {
      console.error('Failed to parse provided users JSON');
    }
  }

  // Check for server-side rendering
  if (typeof window === 'undefined') return [];

  try {
    const storage = getStorageProvider();
    const users = await storage.get<StoredUser[]>(USERS_STORAGE_KEY);

    // Debug log
    if (process.env.NODE_ENV === 'development') {
      console.log('[AUTH] Found stored users:', users?.length || 0);
    }

    return users || [];
  } catch (error) {
    console.error('Error reading users from storage:', error);
    return [];
  }
}

async function saveUsers(users: StoredUser[]): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const storage = getStorageProvider();
    await storage.set(USERS_STORAGE_KEY, users);

    // Debug log
    if (process.env.NODE_ENV === 'development') {
      console.log('[AUTH] Saved users:', users.length);
    }
  } catch (error) {
    console.error('Error saving users to storage:', error);
    throw new AuthError('Failed to save user data', 'storage_error');
  }
}

export async function authenticateUser(
  email: string,
  password: string,
  usersJson?: string
): Promise<CustomUser> {
  try {
    const users = await getStoredUsers(usersJson);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[AUTH] Authenticating user:', { email, usersCount: users.length });
    }

    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      throw new AuthError('No account found with this email. Please check your email or create a new account.', 'invalid_credentials');
    }

    if (!comparePasswords(password, user.hashedPassword)) {
      throw new AuthError('Incorrect password. Please try again.', 'invalid_credentials');
    }

    const { hashedPassword, ...safeUserData } = user;
    return safeUserData;

  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError('Something went wrong. Please try again.', 'invalid_credentials');
  }
}

export async function registerUser(
  email: string,
  password: string,
  name?: string
): Promise<CustomUser> {
  const users = await getStoredUsers();
  
  if (users.some(user => user.email.toLowerCase() === email.toLowerCase())) {
    throw new AuthError('This email is already registered. Please use a different email or log in.', 'email_exists');
  }

  const newUser: StoredUser = {
    id: generateUserId(),
    email,
    name: name || email.split('@')[0],
    hashedPassword: hashPassword(password),
    roles: [{ id: '1', name: 'user' }],
  };

  await saveUsers([...users, newUser]);

  // Debug log
  if (process.env.NODE_ENV === 'development') {
    console.log('[AUTH] Registered new user:', { email, id: newUser.id });
  }

  const { hashedPassword, ...safeUserData } = newUser;
  return safeUserData;
}
