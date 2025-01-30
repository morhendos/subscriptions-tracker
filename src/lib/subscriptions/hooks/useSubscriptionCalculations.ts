import { Subscription } from '@/types/subscriptions';
import { calculateSummary } from '../utils/calculations';

/**
 * Hook for subscription-related calculations
 * @param subscriptions List of subscriptions to calculate from
 * @returns Object with calculation methods
 */
export function useSubscriptionCalculations(subscriptions: Subscription[]) {
  return {
    calculateSummary: () => calculateSummary(subscriptions)
  };
}
