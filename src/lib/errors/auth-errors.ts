/**
 * Authentication-related error classes
 * 
 * This module contains error classes specific to authentication and authorization
 */

import { AuthenticationError, AuthorizationError, AppError } from './app-errors';

/**
 * Error thrown when a user is not authenticated (no session)
 */
export class UnauthenticatedError extends AuthenticationError {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'UnauthenticatedError';
  }
}

/**
 * Error thrown when authentication credentials are invalid
 */
export class InvalidCredentialsError extends AuthenticationError {
  constructor(message: string = 'Invalid credentials') {
    super(message);
    this.name = 'InvalidCredentialsError';
  }
}

/**
 * Error thrown when a user account is not found
 */
export class UserNotFoundError extends AuthenticationError {
  constructor(identifier?: string) {
    super(identifier 
      ? `User not found: ${identifier}` 
      : 'User not found');
    this.name = 'UserNotFoundError';
  }
}

/**
 * Error thrown when a user account is disabled
 */
export class AccountDisabledError extends AuthenticationError {
  constructor(message: string = 'Account is disabled') {
    super(message);
    this.name = 'AccountDisabledError';
  }
}

/**
 * Error thrown when a user account is locked
 */
export class AccountLockedError extends AuthenticationError {
  constructor(message: string = 'Account is locked') {
    super(message);
    this.name = 'AccountLockedError';
  }
}

/**
 * Error thrown when a user tries to access a resource they don't own
 */
export class ResourceOwnershipError extends AuthorizationError {
  constructor(
    message: string = 'You do not have permission to access this resource',
    public readonly resourceType?: string,
    public readonly resourceId?: string
  ) {
    super(resourceType && resourceId
      ? `${message}: ${resourceType} with ID ${resourceId}`
      : message);
    this.name = 'ResourceOwnershipError';
  }
}

/**
 * Error thrown when auth debug operations are not allowed
 */
export class DebugOperationNotAllowedError extends AuthorizationError {
  constructor(message: string = 'Debug operations are not allowed in this environment') {
    super(message);
    this.name = 'DebugOperationNotAllowedError';
    this.code = 'auth.debug_not_allowed';
  }
}

/**
 * Error thrown when a session has expired
 */
export class SessionExpiredError extends AuthenticationError {
  constructor(message: string = 'Your session has expired. Please log in again.') {
    super(message);
    this.name = 'SessionExpiredError';
    this.code = 'auth.session_expired';
  }
}

/**
 * Helper function to check if a user is authenticated
 * 
 * @param session - User session object
 * @throws UnauthenticatedError if the user is not authenticated
 */
export function requireAuthentication(session: any): void {
  if (!session?.user?.id) {
    throw new UnauthenticatedError();
  }
}

/**
 * Helper function to check if a user owns a resource
 * 
 * @param userId - User ID from session
 * @param resourceUserId - User ID associated with the resource
 * @param resourceType - Type of resource being accessed
 * @param resourceId - ID of the resource being accessed
 * @throws ResourceOwnershipError if the user doesn't own the resource
 */
export function requireResourceOwnership(
  userId: string, 
  resourceUserId: string,
  resourceType: string,
  resourceId: string
): void {
  if (userId !== resourceUserId) {
    throw new ResourceOwnershipError(
      `You do not have permission to access this resource`,
      resourceType,
      resourceId
    );
  }
}
