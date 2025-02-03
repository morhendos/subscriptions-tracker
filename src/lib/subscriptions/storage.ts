'use client';

import { useState, useEffect } from 'react';
import { Subscription, SubscriptionFormData, BillingPeriod } from '@/types/subscriptions';
import { useSession } from 'next-auth/react';
import { getStorageProvider } from '@/lib/storage';
import { calculateNextBillingDate } from './utils/dates';
import { calculateSummary } from './utils/calculations';

const BASE_STORAGE_KEY = 'subscriptions';

// Helper function to migrate old billing period format to new
function migrateBillingPeriod(period: string): BillingPeriod {
  return period.toUpperCase() as BillingPeriod;
}

/**
 * Custom hook for managing subscription data with persistence
 * @returns {object} Subscription management methods and data
 */
export function useSubscriptionStorage() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  // Get storage key for current user
  const getStorageKey = () => {
    if (!session?.user?.id) return null;
    return `${BASE_STORAGE_KEY}_${session.user.id}`;
  };

  useEffect(() => {
    const loadSubscriptions = async () => {
      const storageKey = getStorageKey();
      if (!storageKey) return;

      try {
        const storage = getStorageProvider();
        const stored = await storage.get<Subscription[]>(storageKey);
        
        // Migrate data if needed
        if (stored) {
          const migratedData = stored.map(sub => ({
            ...sub,
            billingPeriod: migrateBillingPeriod(sub.billingPeriod)
          }));

          // Save migrated data if it's different
          if (JSON.stringify(stored) !== JSON.stringify(migratedData)) {
            await storage.set(storageKey, migratedData);
          }

          setSubscriptions(migratedData);
        } else {
          setSubscriptions([]);
        }
      } catch (error) {
        console.error('Error loading subscriptions:', error);
        setSubscriptions([]);
      }
      setMounted(true);
    };

    loadSubscriptions();
  }, [session?.user?.id]);

  const saveSubscriptions = async (subs: Subscription[]) => {
    const storageKey = getStorageKey();
    if (!storageKey) return;

    try {
      const storage = getStorageProvider();
      await storage.set(storageKey, subs);
      setSubscriptions(subs);
    } catch (error) {
      console.error('Error saving subscriptions:', error);
      throw error;
    }
  };

  const addSubscription = async (data: SubscriptionFormData): Promise<Subscription | null> => {
    const storageKey = getStorageKey();
    if (!storageKey) return null;

    const newSubscription: Subscription = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nextBillingDate: calculateNextBillingDate(data.startDate, data.billingPeriod),
      disabled: false
    };

    await saveSubscriptions([...subscriptions, newSubscription]);
    return newSubscription;
  };

  const updateSubscription = async (id: string, data: Partial<SubscriptionFormData>) => {
    const storageKey = getStorageKey();
    if (!storageKey) return;

    const updated = subscriptions.map(sub => {
      if (sub.id !== id) return sub;

      // Check if billing-related fields are being updated
      // Only consider fields that are explicitly provided in the update
      const isBillingUpdate = 
        'startDate' in data || 
        'billingPeriod' in data;

      const updatedSub = {
        ...sub,
        ...data,
        // Only update these if they're explicitly provided
        startDate: data.startDate ?? sub.startDate,
        billingPeriod: data.billingPeriod ?? sub.billingPeriod,
        description: data.description ?? sub.description,
        updatedAt: new Date().toISOString(),
        // Keep the original nextBillingDate unless billing details changed
        nextBillingDate: isBillingUpdate
          ? calculateNextBillingDate(
              data.startDate ?? sub.startDate,
              data.billingPeriod ?? sub.billingPeriod
            )
          : sub.nextBillingDate
      };

      return updatedSub;
    });

    await saveSubscriptions(updated);
  };

  const toggleSubscription = async (id: string) => {
    const storageKey = getStorageKey();
    if (!storageKey) return;

    const updated = subscriptions.map(sub =>
      sub.id === id
        ? { ...sub, disabled: !sub.disabled, updatedAt: new Date().toISOString() }
        : sub
    );

    await saveSubscriptions(updated);
  };

  const toggleAllSubscriptions = async (enabled: boolean) => {
    const storageKey = getStorageKey();
    if (!storageKey) return;

    const updated = subscriptions.map(sub => ({
      ...sub,
      disabled: !enabled,
      updatedAt: new Date().toISOString()
    }));

    await saveSubscriptions(updated);
  };

  const deleteSubscription = async (id: string) => {
    const storageKey = getStorageKey();
    if (!storageKey) return;

    const filtered = subscriptions.filter(sub => sub.id !== id);
    await saveSubscriptions(filtered);
  };

  return {
    subscriptions,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    toggleSubscription,
    toggleAllSubscriptions,
    calculateSummary: () => calculateSummary(subscriptions),
    mounted
  };
}