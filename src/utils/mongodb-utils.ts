/**
 * MongoDB Utilities
 * 
 * This module re-exports MongoDB utility functions from the mongodb-uri module
 * and adds additional utilities for working with MongoDB in the application.
 */

// Re-export uri utilities from the dedicated module
export { 
  normalizeMongoURI, 
  getSanitizedURI, 
  validateMongoURI, 
  extractDatabaseName 
} from './mongodb-uri';

import { ObjectId } from 'mongodb';

/**
 * Checks if a string is a valid MongoDB ObjectId
 * 
 * @param id - String to check
 * @returns True if the string is a valid ObjectId
 */
export function isValidObjectId(id: string): boolean {
  try {
    return ObjectId.isValid(id);
  } catch {
    return false;
  }
}

/**
 * Safely converts a string to a MongoDB ObjectId
 * 
 * @param id - String to convert
 * @returns MongoDB ObjectId or null if invalid
 */
export function toObjectId(id: string): ObjectId | null {
  try {
    if (ObjectId.isValid(id)) {
      return new ObjectId(id);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Formats a MongoDB error message for user display
 * 
 * @param error - The error object
 * @param fallbackMessage - Fallback message if error can't be parsed
 * @returns User-friendly error message
 */
export function formatMongoError(error: any, fallbackMessage: string = 'Database error'): string {
  if (!error) {
    return fallbackMessage;
  }
  
  // Handle mongoose/MongoDB specific errors
  if (error.name === 'MongoServerError') {
    // Handle duplicate key errors
    if (error.code === 11000) {
      const keyValue = error.keyValue ? Object.keys(error.keyValue).join(', ') : 'field';
      return `A record with this ${keyValue} already exists`;
    }
    return `Database error: ${error.message}`;
  }
  
  // Handle validation errors
  if (error.name === 'ValidationError' && error.errors) {
    const messages = Object.values(error.errors)
      .map((err: any) => err.message || 'Validation failed')
      .join('; ');
    return `Validation error: ${messages}`;
  }
  
  // Handle connection errors
  if (error.name === 'MongoNetworkError') {
    return 'Unable to connect to database. Please try again later.';
  }
  
  // Handle generic errors
  if (error instanceof Error) {
    return error.message;
  }
  
  // Default fallback
  return fallbackMessage;
}
