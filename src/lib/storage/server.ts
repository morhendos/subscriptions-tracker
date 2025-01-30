import { cookies } from 'next/headers';
import { Subscription, SubscriptionFormData } from '@/types/subscriptions';
import { calculateNextBillingDate } from '../subscriptions/utils/dates';

const BASE_STORAGE_KEY = 'subscriptions';

export class ServerStorage {
  private getUserKey(userId: string): string {
    return `${BASE_STORAGE_KEY}_${userId}`;
  }

  async getSubscriptions(userId: string): Promise<Subscription[]> {
    const cookieStore = cookies();
    const data = cookieStore.get(this.getUserKey(userId))?.value;
    if (!data) return [];

    try {
      return JSON.parse(data) as Subscription[];
    } catch {
      return [];
    }
  }

  async createSubscription(userId: string, data: SubscriptionFormData): Promise<Subscription> {
    const subscriptions = await this.getSubscriptions(userId);

    const newSubscription: Subscription = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nextBillingDate: calculateNextBillingDate(data.startDate, data.billingPeriod),
      disabled: false
    };

    const updatedSubscriptions = [...subscriptions, newSubscription];
    await this.saveSubscriptions(userId, updatedSubscriptions);

    return newSubscription;
  }

  async updateSubscription(userId: string, id: string, data: Partial<SubscriptionFormData>): Promise<Subscription | null> {
    const subscriptions = await this.getSubscriptions(userId);
    const subscriptionIndex = subscriptions.findIndex(sub => sub.id === id);

    if (subscriptionIndex === -1) return null;

    const subscription = subscriptions[subscriptionIndex];
    const isBillingUpdate = data.startDate !== undefined || data.billingPeriod !== undefined;

    const updatedSubscription: Subscription = {
      ...subscription,
      ...data,
      updatedAt: new Date().toISOString(),
      nextBillingDate: isBillingUpdate
        ? calculateNextBillingDate(
            data.startDate || subscription.startDate,
            data.billingPeriod || subscription.billingPeriod
          )
        : subscription.nextBillingDate
    };

    subscriptions[subscriptionIndex] = updatedSubscription;
    await this.saveSubscriptions(userId, subscriptions);

    return updatedSubscription;
  }

  async deleteSubscription(userId: string, id: string): Promise<boolean> {
    const subscriptions = await this.getSubscriptions(userId);
    const filteredSubscriptions = subscriptions.filter(sub => sub.id !== id);

    if (filteredSubscriptions.length === subscriptions.length) {
      return false;
    }

    await this.saveSubscriptions(userId, filteredSubscriptions);
    return true;
  }

  private async saveSubscriptions(userId: string, subscriptions: Subscription[]): Promise<void> {
    // In a real implementation, we would use a more robust storage solution
    // For now, we're using cookies with a max size limit
    const data = JSON.stringify(subscriptions);
    if (data.length > 4096) {
      throw new Error('Storage limit exceeded');
    }

    cookies().set(this.getUserKey(userId), data);
  }
}

export const serverStorage = new ServerStorage();
