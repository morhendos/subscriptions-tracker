/**
 * Error Response Helpers
 * 
 * Utilities for creating consistent error responses in API endpoints.
 */

import { NextResponse } from 'next/server';
import { MongoDBError, MongoDBErrorCode, handleMongoError } from '@/lib/db/error-handler';
import { userFacingErrorMessages } from '@/lib/db/unified-error-handler';
import { AppError, isAppError, toAppError } from './app-errors';

/**
 * MongoDB error code to HTTP status code mapping
 */
const mongoErrorToStatusCode: Record<string, number> = {
  [MongoDBErrorCode.CONNECTION_FAILED]: 503,
  [MongoDBErrorCode.CONNECTION_TIMEOUT]: 503,
  [MongoDBErrorCode.QUERY_FAILED]: 500,
  [MongoDBErrorCode.VALIDATION_FAILED]: 400,
  [MongoDBErrorCode.DUPLICATE_KEY]: 409,
  [MongoDBErrorCode.CREATE_FAILED]: 500,
  [MongoDBErrorCode.UPDATE_FAILED]: 500,
  [MongoDBErrorCode.DELETE_FAILED]: 500,
  [MongoDBErrorCode.UNKNOWN]: 500,
};

/**
 * Creates an error response object for API routes
 * 
 * @param error Any error (will be converted to AppError or MongoDBError)
 * @param includeDetails Whether to include technical details (default: false)
 * @returns Object suitable for API response
 */
export function createErrorObject(error: any, includeDetails = false): any {
  // Handle app errors
  if (isAppError(error)) {
    const response = {
      success: false,
      error: error.message,
      code: error.code,
    };

    // Include details if requested or in development
    if (includeDetails || process.env.NODE_ENV === 'development') {
      return {
        ...response,
        details: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          ...(error.originalError ? { originalError: error.originalError } : {}),
          ...(error.details ? { validationDetails: error.details } : {})
        }
      };
    }

    return response;
  }

  // Handle MongoDB errors
  const mongoError = error instanceof MongoDBError ? error : handleMongoError(error);
  
  const response = {
    success: false,
    error: userFacingErrorMessages[mongoError.code] || userFacingErrorMessages[MongoDBErrorCode.UNKNOWN],
    code: mongoError.code,
  };
  
  // Include technical details in development or if explicitly requested
  if (includeDetails || process.env.NODE_ENV === 'development') {
    return {
      ...response,
      details: {
        message: mongoError.message,
        stack: mongoError.stack,
        originalError: mongoError.originalError
      }
    };
  }
  
  return response;
}

/**
 * Creates a NextResponse with appropriate status code and error details
 * 
 * @param error Any error (will be converted to AppError or MongoDBError)
 * @param includeDetails Whether to include technical details
 * @returns NextResponse with error details and appropriate status code
 */
export function createErrorResponse(error: any, includeDetails = false): NextResponse {
  // For AppErrors, use their status code
  if (isAppError(error)) {
    return NextResponse.json(
      createErrorObject(error, includeDetails),
      { status: error.statusCode }
    );
  }

  // For MongoDB errors, map to appropriate status code
  const mongoError = error instanceof MongoDBError ? error : handleMongoError(error);
  const statusCode = mongoErrorToStatusCode[mongoError.code] || 500;

  return NextResponse.json(
    createErrorObject(mongoError, includeDetails),
    { status: statusCode }
  );
}

/**
 * Creates a standard error handler function for API routes
 * 
 * @param context Optional context string for error logging
 * @returns Error handler function
 */
export function createApiErrorHandler(context?: string) {
  return (error: any) => {
    // Log error with context
    console.error(`API Error${context ? ` in ${context}` : ''}:`, error);
    
    // Determine if we're in development mode
    const isDev = process.env.NODE_ENV === 'development';
    
    // Convert to app error if needed and create response
    const appError = isAppError(error) ? error : toAppError(error);
    return createErrorResponse(appError, isDev);
  };
}
