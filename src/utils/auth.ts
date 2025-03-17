import { Session } from 'next-auth';
import { Role } from '@/types/auth';

/**
 * Check if a user has the admin role
 * @param user User object from session
 * @returns boolean indicating if user has admin role
 */
export function isAdmin(user: Session['user'] | null | undefined): boolean {
  if (!user) {
    console.log('[AUTH UTILS] isAdmin: No user provided');
    return false;
  }
  
  // Check if roles property exists and is an array
  if (!user.roles || !Array.isArray(user.roles)) {
    console.log('[AUTH UTILS] isAdmin: No roles array found', user);
    return false;
  }
  
  // Check for admin role
  const hasAdminRole = user.roles.some(role => 
    typeof role === 'object' && role !== null && role.name === 'admin'
  );
  
  console.log('[AUTH UTILS] isAdmin result:', hasAdminRole, 'for roles:', user.roles);
  return hasAdminRole;
}

/**
 * Check if a user has a specific role
 * @param user User object from session
 * @param roleName Name of the role to check
 * @returns boolean indicating if user has the specified role
 */
export function hasRole(user: Session['user'] | null | undefined, roleName: string): boolean {
  if (!user || !user.roles || !Array.isArray(user.roles)) {
    console.log('[AUTH UTILS] hasRole: No valid user or roles array found');
    return false;
  }
  
  const hasRole = user.roles.some(role => 
    typeof role === 'object' && role !== null && role.name === roleName
  );
  
  console.log('[AUTH UTILS] hasRole result:', hasRole, 'for role:', roleName);
  return hasRole;
}

/**
 * Get all roles for a user
 * @param user User object from session
 * @returns Array of role names or empty array if no roles
 */
export function getUserRoles(user: Session['user'] | null | undefined): string[] {
  if (!user || !user.roles || !Array.isArray(user.roles)) {
    return [];
  }
  
  return user.roles
    .filter(role => typeof role === 'object' && role !== null && typeof role.name === 'string')
    .map(role => role.name);
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
