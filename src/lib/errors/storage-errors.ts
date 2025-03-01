/**
 * Storage-specific error classes
 * 
 * This module contains error classes specific to storage operations
 */

import { AppError, ValidationError, NotFoundError } from './app-errors';

/**
 * Error thrown when a storage operation fails
 */
export class StorageOperationError extends AppError {
  constructor(
    message: string = 'Storage operation failed',
    public readonly operation: 'get' | 'set' | 'delete' | 'clear',
    originalError?: any
  ) {
    super(
      `${message} (${operation})`, 
      `storage.${operation}_failed`, 
      500, 
      originalError
    );
    this.name = 'StorageOperationError';
  }
}

/**
 * Error thrown when storage is not available
 */
export class StorageUnavailableError extends AppError {
  constructor(message: string = 'Storage is unavailable', originalError?: any) {
    super(message, 'storage.unavailable', 503, originalError);
    this.name = 'StorageUnavailableError';
  }
}

/**
 * Error thrown when a storage key is invalid
 */
export class InvalidStorageKeyError extends ValidationError {
  constructor(key?: string) {
    super(
      key ? `Invalid storage key: ${key}` : 'Invalid storage key format',
      { key }
    );
    this.name = 'InvalidStorageKeyError';
  }
}

/**
 * Error thrown when a storage item is not found
 */
export class StorageItemNotFoundError extends NotFoundError {
  constructor(key: string) {
    super('Storage item not found', 'storage-item', key);
    this.name = 'StorageItemNotFoundError';
  }
}

/**
 * Error thrown when storage quota is exceeded
 */
export class StorageQuotaExceededError extends AppError {
  constructor(
    message: string = 'Storage quota exceeded',
    public readonly size?: number,
    public readonly limit?: number
  ) {
    super(
      size && limit 
        ? `${message}: ${size} bytes exceeds ${limit} bytes limit` 
        : message,
      'storage.quota_exceeded',
      413 // HTTP 413 Payload Too Large
    );
    this.name = 'StorageQuotaExceededError';
  }

  /**
   * Convert the error to a plain object for serialization
   */
  toJSON() {
    return {
      ...super.toJSON(),
      size: this.size,
      limit: this.limit
    };
  }
}

/**
 * Error thrown when parsing storage data fails
 */
export class StorageParseError extends AppError {
  constructor(message: string = 'Failed to parse storage data', originalError?: any) {
    super(message, 'storage.parse_error', 500, originalError);
    this.name = 'StorageParseError';
  }
}

/**
 * Determines if the provided key is valid for storage operations
 * 
 * @param key - The storage key to validate
 * @returns True if the key is valid
 * @throws InvalidStorageKeyError if the key is invalid
 */
export function validateStorageKey(key: any): boolean {
  if (!key) {
    throw new InvalidStorageKeyError('Key is required');
  }
  
  if (typeof key !== 'string') {
    throw new InvalidStorageKeyError('Key must be a string');
  }
  
  if (key.trim() === '') {
    throw new InvalidStorageKeyError('Key cannot be empty');
  }
  
  return true;
}
