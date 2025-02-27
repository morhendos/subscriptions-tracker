/**
 * MongoDB Error Handler
 * 
 * Provides standardized error handling for MongoDB operations with custom error
 * classes and consistent formatting.
 */

/**
 * MongoDB Error Codes
 */
export enum MongoDBErrorCode {
  // Connection errors
  CONNECTION_FAILED = 'mongodb.connection_failed',
  CONNECTION_TIMEOUT = 'mongodb.connection_timeout',
  INVALID_URI = 'mongodb.invalid_uri',
  AUTH_FAILED = 'mongodb.auth_failed',
  
  // Query errors
  QUERY_FAILED = 'mongodb.query_failed',
  VALIDATION_FAILED = 'mongodb.validation_failed',
  DUPLICATE_KEY = 'mongodb.duplicate_key',
  
  // Operation errors
  CREATE_FAILED = 'mongodb.create_failed',
  UPDATE_FAILED = 'mongodb.update_failed',
  DELETE_FAILED = 'mongodb.delete_failed',
  
  // Other errors
  UNKNOWN = 'mongodb.unknown_error',
}

/**
 * MongoDB Error Class
 */
export class MongoDBError extends Error {
  /**
   * Creates a new MongoDB error
   * 
   * @param message - Error message
   * @param code - Error code
   * @param originalError - Original error that was caught
   */
  constructor(
    message: string,
    public readonly code: MongoDBErrorCode,
    public readonly originalError?: any
  ) {
    super(message);
    this.name = 'MongoDBError';
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MongoDBError);
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
      stack: this.stack,
    };
  }
}

/**
 * Extract the most useful error message from a MongoDB error
 * 
 * @param error - Error to extract message from
 * @returns Formatted error message
 */
export function getMongoErrorMessage(error: any): string {
  if (!error) {
    return 'Unknown MongoDB error occurred';
  }
  
  // Handle mongoose/MongoDB errors
  if (error.name === 'MongoServerError') {
    return `MongoDB Error: ${error.message}`;
  }
  
  if (error.name === 'ValidationError' && error.errors) {
    const messages = Object.values(error.errors)
      .map((err: any) => err.message || 'Validation failed')
      .join('; ');
    return `Validation Error: ${messages}`;
  }
  
  if (error.name === 'MongooseError') {
    return `Mongoose Error: ${error.message}`;
  }
  
  // Handle timeout errors - more thorough detection
  if (isTimeoutError(error)) {
    return `Database operation timed out. Please try again later.`;
  }
  
  // Handle our custom error
  if (error instanceof MongoDBError) {
    return error.message;
  }
  
  // Handle standard errors
  if (error instanceof Error) {
    return error.message;
  }
  
  // Handle unknown errors
  return String(error);
}

/**
 * Check if an error is a timeout-related error
 */
function isTimeoutError(error: any): boolean {
  if (!error) return false;
  
  // Check error message for timeout indicators
  const errorMessage = error.message || String(error);
  const timeoutIndicators = [
    'timed out',
    'timeout',
    'ETIMEDOUT',
    'ESOCKETTIMEDOUT',
    'socket timeout',
    'Server selection timed out',
    'deadline expired',
    'operation exceeded time limit',
    'exceeded maximum execution time'
  ];
  
  for (const indicator of timeoutIndicators) {
    if (errorMessage.toLowerCase().includes(indicator.toLowerCase())) {
      return true;
    }
  }
  
  // Check for timeout status codes
  if (error.code === 50 || // MongoDB timeout
     error.code === 'ECONNABORTED' || 
     error.code === 'ETIMEDOUT') {
    return true;
  }
  
  return false;
}

/**
 * Determine the appropriate error code for a MongoDB error
 * 
 * @param error - Error to analyze
 * @returns Appropriate error code
 */
export function getMongoErrorCode(error: any): MongoDBErrorCode {
  if (!error) {
    return MongoDBErrorCode.UNKNOWN;
  }
  
  // Handle standard MongoDB errors
  if (error.name === 'MongoServerError') {
    // Duplicate key error
    if (error.code === 11000) {
      return MongoDBErrorCode.DUPLICATE_KEY;
    }
    
    // Authentication error
    if (error.code === 18 || error.code === 8000 || error.message.includes('auth')) {
      return MongoDBErrorCode.AUTH_FAILED;
    }
    
    return MongoDBErrorCode.QUERY_FAILED;
  }
  
  // Handle mongoose validation errors
  if (error.name === 'ValidationError') {
    return MongoDBErrorCode.VALIDATION_FAILED;
  }
  
  // Handle timeout errors
  if (isTimeoutError(error)) {
    return MongoDBErrorCode.CONNECTION_TIMEOUT;
  }
  
  // Handle connection errors
  if (error.name === 'MongoNetworkError' || 
      error.message.includes('connect') || 
      error.message.includes('connection')) {
    return MongoDBErrorCode.CONNECTION_FAILED;
  }
  
  // Handle invalid URI errors
  if (error.message.includes('URI') || error.message.includes('invalid')) {
    return MongoDBErrorCode.INVALID_URI;
  }
  
  // Handle our custom error
  if (error instanceof MongoDBError) {
    return error.code;
  }
  
  // Default to unknown error
  return MongoDBErrorCode.UNKNOWN;
}

/**
 * Handle MongoDB errors in a standardized way
 * 
 * @param error - Error that occurred
 * @param context - Optional context description
 * @returns Standardized MongoDBError instance
 */
export function handleMongoError(error: any, context?: string): MongoDBError {
  const code = getMongoErrorCode(error);
  let message = getMongoErrorMessage(error);
  
  // Add context if provided
  if (context) {
    message = `${context}: ${message}`;
  }
  
  // For timeout errors, always provide a clear user-friendly message
  if (code === MongoDBErrorCode.CONNECTION_TIMEOUT) {
    message = context 
      ? `${context}: Database operation timed out. Please try again later.`
      : 'Database operation timed out. Please try again later.';
  }
  
  return new MongoDBError(message, code, error);
}

/**
 * Logs a MongoDB error with appropriate context and detail
 * 
 * @param error - Error to log
 * @param context - Context where the error occurred
 * @param logger - Logger to use (defaults to console)
 */
export function logMongoError(error: any, context: string, logger = console): void {
  const errorDetails = {
    name: error.name || 'Unknown',
    message: error.message || String(error),
    code: error.code,
    stack: error.stack ? error.stack.split('\n').slice(0, 3).join('\n') : undefined,
    context
  };
  
  logger.error(`[MongoDB] Error in ${context}:`, errorDetails);
}