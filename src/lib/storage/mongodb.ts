import { IStorageProvider, StorageError } from './types';
import { SubscriptionModel } from '@/models/subscription';
import clientPromise from '@/lib/db';
import mongoose from 'mongoose';

export class MongoDBStorageProvider implements IStorageProvider {
  private connected = false;

  private async ensureConnection() {
    if (!this.connected) {
      try {
        await clientPromise;
        this.connected = true;
      } catch (error) {
        throw new StorageError(
          'Could not connect to MongoDB',
          'storage_unavailable'
        );
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    await this.ensureConnection();

    try {
      // Extract userId from key (format: subscriptions_userId)
      const userId = key.split('_')[1];
      if (!userId) {
        throw new Error('Invalid storage key format');
      }

      // Get all subscriptions for user
      const subscriptions = await SubscriptionModel.find({ userId })
        .sort({ nextBillingDate: 1 })
        .lean();

      // Convert MongoDB documents to our app's Subscription type
      const result = subscriptions.map(sub => ({
        id: sub._id.toString(),
        name: sub.name,
        price: sub.price,
        currency: sub.currency,
        billingPeriod: sub.billingPeriod,
        startDate: sub.startDate.toISOString(),
        nextBillingDate: sub.nextBillingDate.toISOString(),
        description: sub.description,
        disabled: sub.disabled,
        createdAt: sub.createdAt.toISOString(),
        updatedAt: sub.updatedAt.toISOString()
      }));

      return result as T;
    } catch (error) {
      throw new StorageError(
        `Failed to read from MongoDB: ${error.message}`,
        'read_error'
      );
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.ensureConnection();

    try {
      // Extract userId from key
      const userId = key.split('_')[1];
      if (!userId) {
        throw new Error('Invalid storage key format');
      }

      // Process array of subscriptions
      const subscriptions = value as any[];
      
      // Check if we're in a replica set environment
      const isReplicaSet = mongoose.connection.client.topology?.hasOwnProperty('replSet');

      if (isReplicaSet) {
        // Use transaction if in replica set
        const session = await SubscriptionModel.startSession();
        await session.withTransaction(async () => {
          await this.updateSubscriptions(userId, subscriptions, session);
        });
        await session.endSession();
      } else {
        // Direct operations if not in replica set
        await this.updateSubscriptions(userId, subscriptions);
      }
    } catch (error) {
      throw new StorageError(
        `Failed to write to MongoDB: ${error.message}`,
        'write_error'
      );
    }
  }

  private async updateSubscriptions(userId: string, subscriptions: any[], session?: mongoose.ClientSession) {
    const options = session ? { session } : {};

    // Remove existing subscriptions
    await SubscriptionModel.deleteMany({ userId }, options);

    // Prepare new subscription documents
    const docs = subscriptions.map(sub => ({
      userId,
      name: sub.name,
      price: sub.price,
      currency: sub.currency,
      billingPeriod: sub.billingPeriod,
      startDate: new Date(sub.startDate),
      nextBillingDate: new Date(sub.nextBillingDate),
      description: sub.description,
      disabled: sub.disabled
    }));

    // Insert new subscriptions
    if (docs.length > 0) {
      await SubscriptionModel.insertMany(docs, options);
    }
  }

  async remove(key: string): Promise<void> {
    await this.ensureConnection();

    try {
      const userId = key.split('_')[1];
      if (!userId) {
        throw new Error('Invalid storage key format');
      }

      await SubscriptionModel.deleteMany({ userId });
    } catch (error) {
      throw new StorageError(
        `Failed to remove data from MongoDB: ${error.message}`,
        'write_error'
      );
    }
  }

  async clear(): Promise<void> {
    await this.ensureConnection();

    try {
      await SubscriptionModel.deleteMany({});
    } catch (error) {
      throw new StorageError(
        `Failed to clear MongoDB data: ${error.message}`,
        'write_error'
      );
    }
  }
}
