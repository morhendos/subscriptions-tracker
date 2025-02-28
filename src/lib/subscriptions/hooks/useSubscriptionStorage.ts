import { useState, useEffect, useCallback } from 'react';
import { Subscription, SubscriptionFormData } from '@/types/subscriptions';
import { calculateSummary } from '../utils/calculations';
import { calculateNextBillingDate } from '../utils/dates';
import { MongoDBStorageProvider } from '@/lib/storage/mongodb';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';

const STORAGE_KEY_PREFIX = 'subscriptions';

/**
 * Custom hook for managing subscription data with MongoDB persistence
 * Implements optimistic UI updates for all operations
 */
export function useSubscriptionStorage() {
  const [mounted, setMounted] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { data: session } = useSession();
  const storage = new MongoDBStorageProvider();
  const { toast } = useToast();

  // Use email as userId, ensure it exists
  const userId = session?.user?.email;
  const storageKey = `${STORAGE_KEY_PREFIX}_${userId || ''}`;

  const loadSubscriptions = async () => {
    // Don't attempt to load if no userId
    if (!userId) {
      console.log('No userId available, skipping load');
      setLoading(false);
      setSubscriptions([]);
      return;
    }

    try {
      console.log('Loading subscriptions for user:', userId);
      setLoading(true);
      setError(null);
      const data = await storage.get<Subscription[]>(storageKey);
      console.log('Loaded subscriptions:', data);
      setSubscriptions(data || []);
    } catch (err) {
      console.error('Error loading subscriptions:', err);
      setError(err instanceof Error ? err : new Error('Failed to load subscriptions'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Session changed:', session);
    setMounted(true);
    // Only load if we have a userId
    if (userId) {
      loadSubscriptions();
    }
  }, [userId]); 

  // Save data in the background, with optional silent error handling
  const saveSubscriptions = async (subs: Subscription[], silent = false) => {
    if (!userId) {
      console.log('No userId available, cannot save');
      throw new Error('User not authenticated');
    }

    try {
      await storage.set(storageKey, subs);
      return true;
    } catch (err) {
      console.error('Error saving subscriptions:', err);
      if (!silent) throw err;
      return false;
    }
  };

  const addSubscription = async (data: SubscriptionFormData): Promise<Subscription> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const newSubscription: Subscription = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nextBillingDate: calculateNextBillingDate(data.startDate, data.billingPeriod),
      disabled: false
    };

    // Optimistically update UI
    const updatedSubs = [...subscriptions, newSubscription];
    setSubscriptions(updatedSubs);
    
    // Background save
    saveSubscriptions(updatedSubs, true).catch(() => {
      // On error, revert UI and notify
      setSubscriptions(subscriptions);
    });
    
    return newSubscription;
  };

  const updateSubscription = useCallback(async (id: string, data: Partial<SubscriptionFormData>) => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Optimistically update UI first
    const originalSubs = [...subscriptions];
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
    
    setSubscriptions(updatedSubs);
    
    // Save in background
    saveSubscriptions(updatedSubs, true).catch(() => {
      // On error, revert UI
      setSubscriptions(originalSubs);
    });
  }, [subscriptions, userId]);

  const toggleSubscription = useCallback(async (id: string) => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Immediately update UI (optimistic update)
    const originalSubs = [...subscriptions];
    const updatedSubs = subscriptions.map(sub =>
      sub.id === id
        ? { ...sub, disabled: !sub.disabled, updatedAt: new Date().toISOString() }
        : sub
    );
    
    setSubscriptions(updatedSubs);
    
    // Save to database in background
    saveSubscriptions(updatedSubs, true).catch(() => {
      // If save fails, revert the UI change silently
      setSubscriptions(originalSubs);
    });
  }, [subscriptions, userId]);

  const toggleAllSubscriptions = useCallback(async (enabled: boolean) => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Immediately update UI (optimistic update)
    const originalSubs = [...subscriptions];
    const updatedSubs = subscriptions.map(sub => ({
      ...sub,
      disabled: !enabled,
      updatedAt: new Date().toISOString()
    }));
    
    setSubscriptions(updatedSubs);
    
    // Save to database in background
    saveSubscriptions(updatedSubs, true).catch(() => {
      // If save fails, revert the UI change silently
      setSubscriptions(originalSubs);
    });
  }, [subscriptions, userId]);

  const deleteSubscription = useCallback(async (id: string) => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Immediately update UI (optimistic update)
    const originalSubs = [...subscriptions];
    const filteredSubs = subscriptions.filter(sub => sub.id !== id);
    
    setSubscriptions(filteredSubs);
    
    // Save to database in background
    saveSubscriptions(filteredSubs, true).catch(() => {
      // If save fails, revert the UI change silently
      setSubscriptions(originalSubs);
    });
  }, [subscriptions, userId]);

  const retry = () => {
    console.log('Retrying subscription load');
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