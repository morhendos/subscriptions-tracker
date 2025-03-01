/**
 * Storage Service
 * 
 * This module provides service functions for storage operations.
 */

import { withConnection } from '@/lib/db/simplified-connection';
import { withErrorHandling } from '@/lib/db/unified-error-handler';
import { SubscriptionModel } from '@/models/subscription';
import { Subscription } from '@/types/subscriptions';
import mongoose from 'mongoose';

const STORAGE_KEY_PREFIX = 'subscriptions';

/**
 * Extract userId from storage key
 */
function extractUserId(key: string): string | null {
  if (!key.startsWith(STORAGE_KEY_PREFIX + '_')) {
    return null;
  }
  return key.slice(STORAGE_KEY_PREFIX.length + 1);
}

/**
 * Format a subscription document from the database
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
 */
export async function getStorageItem(key: string): Promise<Subscription[] | null> {
  return withErrorHandling(async () => {
    const userId = extractUserId(key);
    if (!userId) {
      return null;
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
 */
export async function saveStorageItem(key: string, value: any[]): Promise<Subscription[]> {
  return withErrorHandling(async () => {
    const userId = extractUserId(key);
    if (!userId) {
      throw new Error('Invalid key format');
    }
    
    return withConnection(async () => {
      // Delete existing subscriptions
      await SubscriptionModel.deleteMany({ userId });
      
      // If there are no subscriptions, return empty array
      if (!value || !Array.isArray(value) || value.length === 0) {
        return [];
      }
      
      // Insert new subscriptions
      const docs = value.map((sub: any) => ({
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
      
      return result.map(formatSubscription);
    });
  }, 'saveStorageItem');
}

/**
 * Delete storage item (subscriptions) for a user
 */
export async function deleteStorageItem(key: string): Promise<boolean> {
  return withErrorHandling(async () => {
    const userId = extractUserId(key);
    if (!userId) {
      return false;
    }
    
    return withConnection(async () => {
      const result = await SubscriptionModel.deleteMany({ userId });
      return result.deletedCount > 0;
    });
  }, 'deleteStorageItem');
}
