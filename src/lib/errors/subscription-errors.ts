/**
 * Subscription-specific error classes
 * 
 * This module contains error classes specific to subscription operations
 */

import { AppError, NotFoundError, ValidationError, ConflictError } from './app-errors';

/**
 * Error thrown when a subscription is not found
 */
export class SubscriptionNotFoundError extends NotFoundError {
  constructor(subscriptionId: string) {
    super('Subscription not found', 'subscription', subscriptionId);
    this.name = 'SubscriptionNotFoundError';
  }
}

/**
 * Error thrown when subscription data is invalid
 */
export class SubscriptionValidationError extends ValidationError {
  constructor(message: string = 'Invalid subscription data', details?: any) {
    super(message, details);
    this.name = 'SubscriptionValidationError';
  }
}

/**
 * Error thrown when a duplicate subscription is detected
 */
export class DuplicateSubscriptionError extends ConflictError {
  constructor(name: string) {
    super('Subscription already exists', 'subscription', name);
    this.name = 'DuplicateSubscriptionError';
  }
}

/**
 * Error thrown when a subscription operation fails
 */
export class SubscriptionOperationError extends AppError {
  constructor(
    message: string = 'Subscription operation failed',
    public readonly operation: 'create' | 'update' | 'delete' | 'read',
    originalError?: any
  ) {
    super(
      `${message} (${operation})`, 
      `subscription.${operation}_failed`, 
      500, 
      originalError
    );
    this.name = 'SubscriptionOperationError';
  }
}

/**
 * Error thrown when attempting to disable a subscription that's already disabled
 */
export class SubscriptionAlreadyDisabledError extends AppError {
  constructor(subscriptionId: string) {
    super(
      `Subscription already disabled`,
      'subscription.already_disabled',
      400
    );
    this.name = 'SubscriptionAlreadyDisabledError';
  }
}

/**
 * Error thrown when attempting to enable a subscription that's already enabled
 */
export class SubscriptionAlreadyEnabledError extends AppError {
  constructor(subscriptionId: string) {
    super(
      `Subscription already enabled`,
      'subscription.already_enabled',
      400
    );
    this.name = 'SubscriptionAlreadyEnabledError';
  }
}

/**
 * Error thrown when a subscription has invalid billing information
 */
export class InvalidBillingInfoError extends ValidationError {
  constructor(message: string = 'Invalid billing information', details?: any) {
    super(message, details);
    this.name = 'InvalidBillingInfoError';
  }
}
