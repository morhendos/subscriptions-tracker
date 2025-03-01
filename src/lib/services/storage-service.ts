/**
 * Storage Service
 * 
 * This module provides service functions for storage-related operations.
 * It centralizes storage logic for subscriptions and other data.
 */

import { withConnection } from '@/lib/db/simplified-connection';
import { withErrorHandling } from '@/lib/db/unified-error-handler';
import { SubscriptionModel } from '@/models/subscription';
import { Subscription } from '@/types/subscriptions';
import mongoose from 'mongoose';

const STORAGE_KEY_PREFIX = 'subscriptions';

/**
 * Extract userId from storage key
 * 
 * @param key - The storage key
 * @returns The extracted userId or null if the key format is invalid
 */
function extractUserId(key: string): string | null {
  if (!key.startsWith(STORAGE_KEY_PREFIX + '_')) {
    return null;
  }
  return key.slice(STORAGE_KEY_PREFIX.length + 1);
}

/**
 * Creates a storage key from a userId
 * 
 * @param userId - The user ID
 * @returns The formatted storage key
 */
function createStorageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}_${userId}`;
}

/**
 * Format a subscription document from MongoDB into the Subscription interface
 * 
 * @param doc - The MongoDB document
 * @returns Formatted subscription
 */
function formatSubscription(doc: any): Subscription {
  return {
    id: doc._id.toString(),
    name: doc.name,
    price: doc.price,
    currency: doc.currency,
    billingPeriod: doc.billingPeriod,
    startDate: doc.startDate instanceof Date ? doc.startDate.toISOString() : doc.startDate,
    nextBillingDate: doc.nextBillingDate instanceof Date ? doc.nextBillingDate.toISOString() : doc.nextBillingDate,
    description: doc.description,
    disabled: doc.disabled || false,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : doc.updatedAt
  };
}

/**
 * Get storage item (subscriptions) for a user
 * 
 * @param key - The storage key (contains userId)
 * @returns Array of subscriptions
 */
export async function getStorageItem(key: string): Promise<Subscription[]> {
  return withErrorHandling(async () => {
    const userId = extractUserId(key);
    if (!userId) {
      throw new Error('Invalid storage key format');
    }

    return withConnection(async () => {
      const subscriptions = await SubscriptionModel.find({ userId })
        .sort({ nextBillingDate: 1 })
        .lean()
        .exec();
      
      return subscriptions.map(formatSubscription);
    });
  }, 'getStorageItem');
}

/**
 * Save storage item (subscriptions) for a user
 * 
 * @param key - The storage key (contains userId)
 * @param value - The subscriptions data to save
 * @returns Array of saved subscriptions
 */
export async function saveStorageItem(key: string, value: Subscription[]): Promise<Subscription[]> {
  return withErrorHandling(async () => {
    const userId = extractUserId(key);
    if (!userId) {
      throw new Error('Invalid storage key format');
    }

    return withConnection(async () => {
      // Delete existing subscriptions
      await SubscriptionModel.deleteMany({ userId });

      // Insert new subscriptions if any
      if (value && value.length > 0) {
        const docs = value.map((sub: Partial<Subscription>) => ({
          userId,
          name: sub.name,
          price: sub.price,
          currency: sub.currency,
          billingPeriod: sub.billingPeriod,
          startDate: sub.startDate ? new Date(sub.startDate) : new Date(),
          nextBillingDate: sub.nextBillingDate ? new Date(sub.nextBillingDate) : new Date(),
          description: sub.description,
          disabled: sub.disabled ?? false
        }));

        const result = await SubscriptionModel.insertMany(docs);
        
        // Return the newly inserted subscriptions with their IDs
        return result.map(formatSubscription);
      }
      
      return [];
    });
  }, 'saveStorageItem');
}

/**
 * Delete storage item (subscriptions) for a user
 * 
 * @param key - The storage key (contains userId)
 * @returns True if the operation was successful
 */
export async function deleteStorageItem(key: string): Promise<boolean> {
  return withErrorHandling(async () => {
    const userId = extractUserId(key);
    if (!userId) {
      throw new Error('Invalid storage key format');
    }

    return withConnection(async () => {
      await SubscriptionModel.deleteMany({ userId });
      return true;
    });
  }, 'deleteStorageItem');
}
