import { useState, useEffect } from 'react';
import { Subscription, SubscriptionFormData } from '@/types/subscriptions';
import { calculateSummary } from '../utils/calculations';
import { calculateNextBillingDate } from '../utils/dates';
import { MongoDBStorageProvider } from '@/lib/storage/mongodb';
import { useSession } from 'next-auth/react';

const STORAGE_KEY_PREFIX = 'subscriptions';

/**
 * Custom hook for managing subscription data with MongoDB persistence
 */
export function useSubscriptionStorage() {
  const [mounted, setMounted] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { data: session } = useSession();
  const storage = new MongoDBStorageProvider();

  const storageKey = `${STORAGE_KEY_PREFIX}_${session?.user?.email}`;

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await storage.get<Subscription[]>(storageKey);
      setSubscriptions(data || []);
    } catch (err) {
      console.error('Error loading subscriptions:', err);
      setError(err instanceof Error ? err : new Error('Failed to load subscriptions'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    if (session?.user?.email) {
      loadSubscriptions();
    }
  }, [session?.user?.email]);

  const saveSubscriptions = async (subs: Subscription[]) => {
    try {
      await storage.set(storageKey, subs);
      setSubscriptions(subs);
    } catch (err) {
      console.error('Error saving subscriptions:', err);
      throw err;
    }
  };

  const addSubscription = async (data: SubscriptionFormData): Promise<Subscription> => {
    const newSubscription: Subscription = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nextBillingDate: calculateNextBillingDate(data.startDate, data.billingPeriod),
      disabled: false
    };

    const updatedSubs = [...subscriptions, newSubscription];
    await saveSubscriptions(updatedSubs);
    return newSubscription;
  };

  const updateSubscription = async (id: string, data: Partial<SubscriptionFormData>) => {
    const updatedSubs = subscriptions.map(sub =>
      sub.id === id
        ? {
            ...sub,
            ...data,
            updatedAt: new Date().toISOString(),
            nextBillingDate: data.startDate || data.billingPeriod
              ? calculateNextBillingDate(data.startDate || sub.startDate, data.billingPeriod || sub.billingPeriod)
              : sub.nextBillingDate
          }
        : sub
    );
    await saveSubscriptions(updatedSubs);
  };

  const toggleSubscription = async (id: string) => {
    const updatedSubs = subscriptions.map(sub =>
      sub.id === id
        ? { ...sub, disabled: !sub.disabled, updatedAt: new Date().toISOString() }
        : sub
    );
    await saveSubscriptions(updatedSubs);
  };

  const toggleAllSubscriptions = async (enabled: boolean) => {
    const updatedSubs = subscriptions.map(sub => ({
      ...sub,
      disabled: !enabled,
      updatedAt: new Date().toISOString()
    }));
    await saveSubscriptions(updatedSubs);
  };

  const deleteSubscription = async (id: string) => {
    const filteredSubs = subscriptions.filter(sub => sub.id !== id);
    await saveSubscriptions(filteredSubs);
  };

  const retry = () => {
    loadSubscriptions();
  };

  return {
    subscriptions,
    error,
    loading,
    retry,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    toggleSubscription,
    toggleAllSubscriptions,
    calculateSummary: () => calculateSummary(subscriptions),
    mounted
  };
}