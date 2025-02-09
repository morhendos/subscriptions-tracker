import { IStorageProvider, StorageError } from './types';
import { SubscriptionModel } from '@/models/subscription';
import clientPromise from '@/lib/db';

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
      
      // Start a session for transaction
      const session = await SubscriptionModel.startSession();
      
      await session.withTransaction(async () => {
        // Remove all existing subscriptions for user
        await SubscriptionModel.deleteMany({ userId }, { session });

        // Insert new subscriptions
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

        await SubscriptionModel.insertMany(docs, { session });
      });

      await session.endSession();
    } catch (error) {
      throw new StorageError(
        `Failed to write to MongoDB: ${error.message}`,
        'write_error'
      );
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
