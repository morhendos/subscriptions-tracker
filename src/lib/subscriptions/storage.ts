'use client';

import { useState, useEffect } from 'react';
import { Subscription, SubscriptionFormData } from '@/types/subscriptions';
import { useSession } from 'next-auth/react';
import { getStorageProvider } from '@/lib/storage';
import { calculateNextBillingDate } from './utils/dates';
import { calculateSummary } from './utils/calculations';

const BASE_STORAGE_KEY = 'subscriptions';

export function useSubscriptionStorage() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  // Get storage key for current user
  const getStorageKey = () => {
    if (!session?.user?.id) return null;
    return `${BASE_STORAGE_KEY}_${session.user.id}`;
  };

  const loadSubscriptions = async () => {
    const storageKey = getStorageKey();
    if (!storageKey) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);
      const storage = getStorageProvider();
      const data = await storage.get<Subscription[]>(storageKey);
      console.log('Loaded subscriptions:', data);
      if (data) {
        setSubscriptions(data);
      } else {
        setSubscriptions([]);
      }
    } catch (err) {
      console.error('Error loading subscriptions:', err);
      setError(err instanceof Error ? err : new Error('Failed to load subscriptions'));
      setSubscriptions([]);
    } finally {
      setLoading(false);
      setMounted(true);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, [session?.user?.id]);

  const saveSubscriptions = async (subs: Subscription[]) => {
    const storageKey = getStorageKey();
    if (!storageKey) return;

    try {
      setError(null);
      const storage = getStorageProvider();
      await storage.set(storageKey, subs);
      await loadSubscriptions(); // Reload after saving
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to save subscriptions'));
      throw err;
    }
  };

  const retry = () => {
    loadSubscriptions();
  };

  return {
    subscriptions,
    error,
    loading,
    mounted,
    retry,
    addSubscription: async (data: SubscriptionFormData): Promise<Subscription | null> => {
      const storageKey = getStorageKey();
      if (!storageKey) return null;

      const newSubscription: Subscription = {
        ...data,
        id: Date.now().toString(),
        nextBillingDate: calculateNextBillingDate(data.startDate, data.billingPeriod),
        disabled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await saveSubscriptions([...subscriptions, newSubscription]);
      return newSubscription;
    },
    updateSubscription: async (id: string, data: Partial<SubscriptionFormData>) => {
      const storageKey = getStorageKey();
      if (!storageKey) return;

      const updated = subscriptions.map(sub => {
        if (sub.id !== id) return sub;

        return {
          ...sub,
          ...data,
          updatedAt: new Date().toISOString(),
          // If billing-related fields are updated, recalculate next billing date
          nextBillingDate: (data.startDate || data.billingPeriod)
            ? calculateNextBillingDate(
                data.startDate || sub.startDate,
                data.billingPeriod || sub.billingPeriod
              )
            : sub.nextBillingDate
        };
      });

      await saveSubscriptions(updated);
    },
    deleteSubscription: async (id: string) => {
      const storageKey = getStorageKey();
      if (!storageKey) return;

      const filtered = subscriptions.filter(sub => sub.id !== id);
      await saveSubscriptions(filtered);
    },
    toggleSubscription: async (id: string) => {
      const storageKey = getStorageKey();
      if (!storageKey) return;

      const updated = subscriptions.map(sub =>
        sub.id === id
          ? { ...sub, disabled: !sub.disabled, updatedAt: new Date().toISOString() }
          : sub
      );

      await saveSubscriptions(updated);
    },
    toggleAllSubscriptions: async (enabled: boolean) => {
      const storageKey = getStorageKey();
      if (!storageKey) return;

      const updated = subscriptions.map(sub => ({
        ...sub,
        disabled: !enabled,
        updatedAt: new Date().toISOString()
      }));

      await saveSubscriptions(updated);
    },
    calculateSummary: () => calculateSummary(subscriptions)
  };
}
