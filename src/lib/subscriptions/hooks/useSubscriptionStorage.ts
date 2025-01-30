import { useState, useEffect } from 'react';
import { Subscription, SubscriptionFormData } from '@/types/subscriptions';
import { calculateSummary } from '../utils/calculations';
import { calculateNextBillingDate } from '../utils/dates';

const STORAGE_KEY = 'subscriptions';

/**
 * Custom hook for managing subscription data with persistence
 * @returns {object} Subscription management methods and data
 * @property {Subscription[]} subscriptions - List of all subscriptions
 * @property {function} addSubscription - Add a new subscription
 * @property {function} updateSubscription - Update existing subscription
 * @property {function} deleteSubscription - Remove a subscription
 * @property {function} toggleSubscription - Toggle subscription active state
 * @property {function} toggleAllSubscriptions - Enable or disable all subscriptions
 * @property {function} calculateSummary - Calculate spending summary
 * @property {boolean} mounted - Component mount status
 */
export function useSubscriptionStorage() {
  const [mounted, setMounted] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSubscriptions(parsed);
      }
    } catch (error) {
      console.error('Error loading subscriptions:', error);
    }
  }, []);

  const addSubscription = (data: SubscriptionFormData): Subscription => {
    const newSubscription: Subscription = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nextBillingDate: calculateNextBillingDate(data.startDate, data.billingPeriod),
      disabled: false
    };

    setSubscriptions(current => {
      const newSubs = [...current, newSubscription];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSubs));
      return newSubs;
    });
    return newSubscription;
  };

  const updateSubscription = (id: string, data: Partial<SubscriptionFormData>) => {
    setSubscriptions(current => {
      const updated = current.map(sub =>
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const toggleSubscription = (id: string) => {
    setSubscriptions(current => {
      const updated = current.map(sub =>
        sub.id === id
          ? { ...sub, disabled: !sub.disabled, updatedAt: new Date().toISOString() }
          : sub
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const toggleAllSubscriptions = (enabled: boolean) => {
    setSubscriptions(current => {
      const updated = current.map(sub => ({
        ...sub,
        disabled: !enabled,
        updatedAt: new Date().toISOString()
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const deleteSubscription = (id: string) => {
    setSubscriptions(current => {
      const filtered = current.filter(sub => sub.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return filtered;
    });
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