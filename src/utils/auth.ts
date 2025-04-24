import { Session } from 'next-auth';
import { Role } from '@/types/auth';

/**
 * Check if a user has the admin role
 * @param user User object from session
 * @returns boolean indicating if user has admin role
 */
export function isAdmin(user: Session['user'] | null | undefined): boolean {
  if (!user || !user.roles) return false;
  
  return user.roles.some(role => role.name === 'admin');
}

/**
 * Check if a user has a specific role
 * @param user User object from session
 * @param roleName Name of the role to check
 * @returns boolean indicating if user has the specified role
 */
export function hasRole(user: Session['user'] | null | undefined, roleName: string): boolean {
  if (!user || !user.roles) return false;
  
  return user.roles.some(role => role.name === roleName);
}

/**
 * Get all roles for a user
 * @param user User object from session
 * @returns Array of role names or empty array if no roles
 */
export function getUserRoles(user: Session['user'] | null | undefined): string[] {
  if (!user || !user.roles) return [];
  
  return user.roles.map(role => role.name);
}

/**
 * Create a new role object
 * @param id Role ID
 * @param name Role name
 * @returns Role object
 */
export function createRole(id: string, name: string): Role {
  return { id, name };
}
