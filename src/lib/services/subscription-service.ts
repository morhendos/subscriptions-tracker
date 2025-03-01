/**
 * Subscription Service
 * 
 * This module provides service functions for subscription-related operations.
 * It centralizes business logic and data access for subscriptions.
 */

import { withConnection } from '@/lib/db/simplified-connection';
import { withErrorHandling } from '@/lib/db/unified-error-handler';
import { SubscriptionModel } from '@/models/subscription';
import { Subscription, SubscriptionFormData } from '@/types/subscriptions';
import { calculateNextBillingDate } from '@/lib/subscriptions/utils/dates';
import mongoose from 'mongoose';

/**
 * Convert a database subscription document to the Subscription interface
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
 * Get all subscriptions for a user
 * 
 * @param userId - The user's ID
 * @returns Array of user subscriptions sorted by next billing date
 */
export async function getUserSubscriptions(userId: string): Promise<Subscription[]> {
  return withErrorHandling(async () => {
    return withConnection(async () => {
      const subscriptions = await SubscriptionModel.find({ userId })
        .sort({ nextBillingDate: 1 })
        .lean()
        .exec();
      
      return subscriptions.map(formatSubscription);
    });
  }, 'getUserSubscriptions');
}

/**
 * Get a single subscription by ID
 * 
 * @param userId - The user's ID
 * @param subscriptionId - The subscription's ID
 * @returns The subscription or null if not found
 */
export async function getSubscriptionById(userId: string, subscriptionId: string): Promise<Subscription | null> {
  return withErrorHandling(async () => {
    return withConnection(async () => {
      const subscription = await SubscriptionModel.findOne({
        _id: new mongoose.Types.ObjectId(subscriptionId),
        userId
      })
        .lean()
        .exec();
      
      if (!subscription) {
        return null;
      }
      
      return formatSubscription(subscription);
    });
  }, 'getSubscriptionById');
}

/**
 * Create a new subscription
 * 
 * @param userId - The user's ID
 * @param data - The subscription data
 * @returns The created subscription
 */
export async function createSubscription(
  userId: string, 
  data: SubscriptionFormData
): Promise<Subscription> {
  return withErrorHandling(async () => {
    return withConnection(async () => {
      const subscription = await SubscriptionModel.create({
        userId,
        ...data,
        nextBillingDate: new Date(calculateNextBillingDate(data.startDate, data.billingPeriod)),
        startDate: new Date(data.startDate),
        disabled: false // Set default value instead of accessing from data
      });
      
      return formatSubscription(subscription);
    });
  }, 'createSubscription');
}

/**
 * Update an existing subscription
 * 
 * @param userId - The user's ID
 * @param subscriptionId - The subscription's ID
 * @param data - The subscription data to update
 * @returns The updated subscription or null if not found
 */
export async function updateSubscription(
  userId: string, 
  subscriptionId: string, 
  data: Partial<SubscriptionFormData>
): Promise<Subscription | null> {
  return withErrorHandling(async () => {
    return withConnection(async () => {
      // Check if the subscription exists and belongs to the user
      const existingSubscription = await SubscriptionModel.findOne({
        _id: new mongoose.Types.ObjectId(subscriptionId),
        userId
      });
      
      if (!existingSubscription) {
        return null;
      }
      
      // Determine if billing-related fields are being updated
      const isBillingUpdate = data.startDate !== undefined || data.billingPeriod !== undefined;
      
      // Prepare update data
      const updateData: Record<string, any> = {
        ...data,
        updatedAt: new Date()
      };
      
      // Calculate new next billing date if billing fields are updated
      if (isBillingUpdate) {
        const startDate = data.startDate || existingSubscription.startDate;
        const billingPeriod = data.billingPeriod || existingSubscription.billingPeriod;
        updateData.nextBillingDate = new Date(calculateNextBillingDate(startDate, billingPeriod));
      }
      
      // Convert date strings to Date objects
      if (data.startDate) {
        updateData.startDate = new Date(data.startDate);
      }
      
      // Update the subscription
      const updatedSubscription = await SubscriptionModel.findByIdAndUpdate(
        subscriptionId,
        { $set: updateData },
        { new: true, runValidators: true }
      )
        .lean()
        .exec();
      
      if (!updatedSubscription) {
        return null;
      }
      
      return formatSubscription(updatedSubscription);
    });
  }, 'updateSubscription');
}

/**
 * Delete a subscription
 * 
 * @param userId - The user's ID
 * @param subscriptionId - The subscription's ID
 * @returns True if the subscription was deleted, false otherwise
 */
export async function deleteSubscription(userId: string, subscriptionId: string): Promise<boolean> {
  return withErrorHandling(async () => {
    return withConnection(async () => {
      const result = await SubscriptionModel.deleteOne({
        _id: new mongoose.Types.ObjectId(subscriptionId),
        userId
      });
      
      return result.deletedCount === 1;
    });
  }, 'deleteSubscription');
}

/**
 * Toggle a subscription's disabled status
 * 
 * @param userId - The user's ID
 * @param subscriptionId - The subscription's ID
 * @returns The updated subscription or null if not found
 */
export async function toggleSubscriptionStatus(
  userId: string, 
  subscriptionId: string
): Promise<Subscription | null> {
  return withErrorHandling(async () => {
    return withConnection(async () => {
      // Find the subscription
      const subscription = await SubscriptionModel.findOne({
        _id: new mongoose.Types.ObjectId(subscriptionId),
        userId
      });
      
      if (!subscription) {
        return null;
      }
      
      // Toggle disabled status
      subscription.disabled = !subscription.disabled;
      subscription.updatedAt = new Date();
      
      // Save changes
      await subscription.save();
      
      return formatSubscription(subscription);
    });
  }, 'toggleSubscriptionStatus');
}

/**
 * Get upcoming bills for a user
 * 
 * @param userId - The user's ID
 * @param daysAhead - Number of days to look ahead (default: 30)
 * @returns Subscriptions due within the specified period
 */
export async function getUpcomingBills(userId: string, daysAhead: number = 30): Promise<Subscription[]> {
  return withErrorHandling(async () => {
    return withConnection(async () => {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + daysAhead);
      
      const subscriptions = await SubscriptionModel.find({
        userId,
        disabled: false,
        nextBillingDate: {
          $gte: today,
          $lte: futureDate
        }
      })
        .sort({ nextBillingDate: 1 })
        .lean()
        .exec();
      
      return subscriptions.map(formatSubscription);
    });
  }, 'getUpcomingBills');
}
