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
 * @returns {object} Subscription management methods and data
 * @property {Subscription[]} subscriptions - List of all subscriptions
 * @property {function} addSubscription - Add a new subscription
 * @property {function} updateSubscription - Update existing subscription
 * @property {function} deleteSubscription - Remove a subscription
 * @property {function} toggleSubscription - Toggle subscription active state
 * @property {function} toggleAllSubscriptions - Enable or disable all subscriptions
 * @property {function} calculateSummary - Calculate spending summary
 * @property {boolean} mounted - Component mount status
 * @property {boolean} loading - Data loading state
 * @property {Error|null} error - Error state if any
 * @property {function} retry - Retry loading data after error
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
  }, [userId]); // Changed from session?.user?.email to userId for consistency

  const saveSubscriptions = async (subs: Subscription[]) => {
    if (!userId) {
      console.log('No userId available, cannot save');
      throw new Error('User not authenticated');
    }

    try {
      console.log('Saving subscriptions:', subs);
      await storage.set(storageKey, subs);
      return true;
    } catch (err) {
      console.error('Error saving subscriptions:', err);
      throw err;
    }
  };

  const addSubscription = async (data: SubscriptionFormData): Promise<Subscription> => {
    console.log('Adding new subscription:', data);
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
    
    try {
      // Persist to database
      await saveSubscriptions(updatedSubs);
      return newSubscription;
    } catch (error) {
      // Revert UI on error
      setSubscriptions(subscriptions);
      toast({
        title: "Error adding subscription",
        description: "Changes couldn't be saved. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateSubscription = async (id: string, data: Partial<SubscriptionFormData>) => {
    console.log('Updating subscription:', id, data);
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Create updated subscription list
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
    
    // Store original subscriptions for rollback
    const originalSubs = [...subscriptions];
    
    // Optimistically update UI
    setSubscriptions(updatedSubs);
    
    try {
      // Persist to database
      await saveSubscriptions(updatedSubs);
    } catch (error) {
      // Revert UI on error
      setSubscriptions(originalSubs);
      toast({
        title: "Update failed",
        description: "Changes couldn't be saved. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const toggleSubscription = useCallback(async (id: string) => {
    console.log('Toggling subscription:', id);
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Store original state for rollback
    const originalSubs = [...subscriptions];
    
    // Perform optimistic update
    const updatedSubs = subscriptions.map(sub =>
      sub.id === id
        ? { ...sub, disabled: !sub.disabled, updatedAt: new Date().toISOString() }
        : sub
    );
    
    // Update UI immediately
    setSubscriptions(updatedSubs);
    
    // Persist to database in the background
    try {
      await saveSubscriptions(updatedSubs);
    } catch (error) {
      // Revert UI on error
      setSubscriptions(originalSubs);
      toast({
        title: "Failed to update subscription",
        description: "Your changes couldn't be saved. Please try again.",
        variant: "destructive"
      });
    }
  }, [subscriptions, userId, toast]);

  const toggleAllSubscriptions = useCallback(async (enabled: boolean) => {
    console.log('Toggling all subscriptions:', enabled);
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Store original state for rollback
    const originalSubs = [...subscriptions];
    
    // Perform optimistic update
    const updatedSubs = subscriptions.map(sub => ({
      ...sub,
      disabled: !enabled,
      updatedAt: new Date().toISOString()
    }));
    
    // Update UI immediately
    setSubscriptions(updatedSubs);
    
    // Persist to database in the background
    try {
      await saveSubscriptions(updatedSubs);
    } catch (error) {
      // Revert UI on error
      setSubscriptions(originalSubs);
      toast({
        title: "Failed to update subscriptions",
        description: "Your changes couldn't be saved. Please try again.",
        variant: "destructive"
      });
    }
  }, [subscriptions, userId, toast]);

  const deleteSubscription = useCallback(async (id: string) => {
    console.log('Deleting subscription:', id);
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Store original state for rollback
    const originalSubs = [...subscriptions];
    
    // Perform optimistic update
    const filteredSubs = subscriptions.filter(sub => sub.id !== id);
    
    // Update UI immediately
    setSubscriptions(filteredSubs);
    
    // Persist to database in the background
    try {
      await saveSubscriptions(filteredSubs);
    } catch (error) {
      // Revert UI on error
      setSubscriptions(originalSubs);
      toast({
        title: "Failed to delete subscription",
        description: "Your changes couldn't be saved. Please try again.",
        variant: "destructive"
      });
    }
  }, [subscriptions, userId, toast]);

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