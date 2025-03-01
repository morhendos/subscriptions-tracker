/**
 * Application Error Classes
 * 
 * This module provides standardized application-specific error classes
 * for more precise error handling and better user feedback.
 */

/**
 * Base application error class
 */
export class AppError extends Error {
  /**
   * Create a new application error
   * 
   * @param message - Error message
   * @param code - Error code for identifying the error type
   * @param statusCode - HTTP status code to use in API responses
   * @param originalError - Original error that was caught
   */
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly originalError?: any
  ) {
    super(message);
    this.name = 'AppError';

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert the error to a plain object for serialization
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      stack: this.stack,
    };
  }
}

/**
 * Validation error for invalid input data
 */
export class ValidationError extends AppError {
  /**
   * Create a new validation error
   * 
   * @param message - Error message
   * @param details - Validation details, e.g., field-specific errors
   * @param originalError - Original error that was caught
   */
  constructor(
    message: string = 'Validation failed',
    public readonly details?: any,
    originalError?: any
  ) {
    super(message, 'validation.failed', 400, originalError);
    this.name = 'ValidationError';
  }

  /**
   * Convert the error to a plain object for serialization
   */
  toJSON() {
    return {
      ...super.toJSON(),
      details: this.details,
    };
  }
}

/**
 * Not found error for missing resources
 */
export class NotFoundError extends AppError {
  /**
   * Create a new not found error
   * 
   * @param message - Error message
   * @param resource - Type of resource that was not found
   * @param id - Identifier of the resource
   */
  constructor(
    message: string = 'Resource not found',
    public readonly resource?: string,
    public readonly id?: string
  ) {
    super(
      id ? `${message}: ${resource || 'Resource'} with ID ${id} not found` : message,
      'resource.not_found', 
      404
    );
    this.name = 'NotFoundError';
  }
}

/**
 * Authorization error for permission issues
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'You do not have permission to perform this action') {
    super(message, 'auth.forbidden', 403);
    this.name = 'AuthorizationError';
  }
}

/**
 * Authentication error for login/session issues
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'auth.unauthorized', 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * Conflict error for duplicate resources
 */
export class ConflictError extends AppError {
  constructor(
    message: string = 'Resource already exists',
    public readonly resource?: string,
    public readonly identifier?: string
  ) {
    super(
      identifier ? `${message}: ${resource || 'Resource'} with identifier ${identifier} already exists` : message,
      'resource.conflict',
      409
    );
    this.name = 'ConflictError';
  }
}

/**
 * Service unavailable error for temporary service issues
 */
export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service temporarily unavailable', originalError?: any) {
    super(message, 'service.unavailable', 503, originalError);
    this.name = 'ServiceUnavailableError';
  }
}

/**
 * Bad request error for malformed requests
 */
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', originalError?: any) {
    super(message, 'request.invalid', 400, originalError);
    this.name = 'BadRequestError';
  }
}

/**
 * Determines if an error is an instance of our AppError
 * 
 * @param error - Error to check
 * @returns True if the error is an AppError instance
 */
export function isAppError(error: any): error is AppError {
  return error instanceof AppError;
}

/**
 * Convert any error to an AppError
 * 
 * @param error - Error to convert
 * @param defaultMessage - Default message to use if none is provided
 * @returns An AppError instance
 */
export function toAppError(error: any, defaultMessage: string = 'An unexpected error occurred'): AppError {
  if (isAppError(error)) {
    return error;
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return new AppError(error.message, 'error.unexpected', 500, error);
  }

  // Handle unknown errors
  return new AppError(
    typeof error === 'string' ? error : defaultMessage,
    'error.unexpected',
    500,
    error
  );
}
