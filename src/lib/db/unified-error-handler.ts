/**
 * Unified Database Error Handler
 * 
 * Provides standardized error handling for database operations with
 * user-friendly error messages and consistent error behavior.
 */

import { MongoDBError, MongoDBErrorCode, handleMongoError, logMongoError } from './error-handler';

/**
 * User-facing error messages mapped to error codes
 * These messages are safe to display to users
 */
export const userFacingErrorMessages: Record<string, string> = {
  [MongoDBErrorCode.CONNECTION_FAILED]: "Unable to connect to database. Please try again later.",
  [MongoDBErrorCode.CONNECTION_TIMEOUT]: "Database operation timed out. Please try again later.",
  [MongoDBErrorCode.QUERY_FAILED]: "Error retrieving data. Please try again.",
  [MongoDBErrorCode.VALIDATION_FAILED]: "The information provided is invalid.",
  [MongoDBErrorCode.DUPLICATE_KEY]: "This record already exists.",
  [MongoDBErrorCode.CREATE_FAILED]: "Unable to create record. Please try again.",
  [MongoDBErrorCode.UPDATE_FAILED]: "Unable to update record. Please try again.",
  [MongoDBErrorCode.DELETE_FAILED]: "Unable to delete record. Please try again.",
  [MongoDBErrorCode.UNKNOWN]: "An unexpected error occurred. Please try again later."
};

/**
 * Get a user-friendly error message based on a database error
 * 
 * @param error Any error object (will be converted to MongoDBError if needed)
 * @returns A user-friendly error message string
 */
export function getUserFacingErrorMessage(error: any): string {
  // If it's already a MongoDBError, use its code to get the message
  if (error instanceof MongoDBError) {
    return userFacingErrorMessages[error.code] || userFacingErrorMessages[MongoDBErrorCode.UNKNOWN];
  }
  
  // Otherwise, convert to MongoDBError first to get proper code
  const mongoError = handleMongoError(error);
  return userFacingErrorMessages[mongoError.code] || userFacingErrorMessages[MongoDBErrorCode.UNKNOWN];
}

/**
 * Create an API response object for a database error
 * 
 * @param error The error that occurred
 * @param includeDetails Whether to include technical details (default: false)
 * @returns Object suitable for API response
 */
export function createErrorResponse(error: any, includeDetails = false): any {
  const mongoError = error instanceof MongoDBError ? error : handleMongoError(error);
  
  const response = {
    success: false,
    error: getUserFacingErrorMessage(mongoError),
    code: mongoError.code,
  };
  
  // Only include technical details in development or if explicitly requested
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
 * Wrapper for database operations with standardized error handling
 * 
 * @param operation Async function that performs the database operation
 * @param context Context description for error logging or options object
 * @param errorHandler Optional custom error handler
 * @returns Promise that resolves to the operation result or rejects with MongoDBError
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string | object,
  errorHandler?: (error: MongoDBError) => void
): Promise<T> {
  // Extract context string from options object if needed
  const contextStr = typeof context === 'string' ? context : 'database-operation';
  
  try {
    return await operation();
  } catch (error) {
    // Convert to standardized MongoDBError
    const mongoError = handleMongoError(error, contextStr);
    
    // Log the error
    logMongoError(mongoError, contextStr);
    
    // Call custom error handler if provided
    if (errorHandler) {
      errorHandler(mongoError);
    }
    
    throw mongoError;
  }
}
