'use client';

import { useState, useEffect } from 'react';
import { Subscription, SubscriptionFormData, BillingPeriod } from '@/types/subscriptions';
import { useSession } from 'next-auth/react';
import { getStorageProvider } from '@/lib/storage';
import { calculateNextBillingDate, calculateNextBillingDateFromPast } from './utils/dates';
import { calculateSummary } from './utils/calculations';

const BASE_STORAGE_KEY = 'subscriptions';

// Helper function to migrate old billing period format to new
function migrateBillingPeriod(period: string): BillingPeriod {
  return period.toUpperCase() as BillingPeriod;
}

function updateStaleNextBillingDates(subscriptions: Subscription[]): Subscription[] {
  const now = new Date();
  let hasChanges = false;

  const updated = subscriptions.map(sub => {
    const nextBilling = new Date(sub.nextBillingDate);
    
    // If next billing date has passed
    if (nextBilling < now) {
      hasChanges = true;
      return {
        ...sub,
        nextBillingDate: calculateNextBillingDateFromPast(
          sub.startDate,
          sub.billingPeriod,
          sub.nextBillingDate
        )
      };
    }
    
    return sub;
  });

  return hasChanges ? updated : subscriptions;
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

          // Update any stale next billing dates
          const updatedData = updateStaleNextBillingDates(migratedData);

          // Save if there were any changes (migration or billing updates)
          if (JSON.stringify(stored) !== JSON.stringify(updatedData)) {
            await storage.set(storageKey, updatedData);
          }

          setSubscriptions(updatedData);
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
      // Update any stale dates before saving
      const updatedSubs = updateStaleNextBillingDates(subs);
      await storage.set(storageKey, updatedSubs);
      setSubscriptions(updatedSubs);
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
        // If it's a billing update, calculate from the new fields
        // If not, use the existing next billing date but check if it needs updating
        nextBillingDate: isBillingUpdate
          ? calculateNextBillingDate(
              data.startDate ?? sub.startDate,
              data.billingPeriod ?? sub.billingPeriod
            )
          : calculateNextBillingDateFromPast(
              sub.startDate,
              sub.billingPeriod,
              sub.nextBillingDate
            )
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