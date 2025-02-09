'use client';

import { useSubscriptionStorage } from '@/lib/subscriptions/storage';
import { Section } from '@/components/common/Section';
import { SubscriptionList } from './SubscriptionList';
import { SubscriptionSummary } from './SubscriptionSummary';

interface Props {
  variant?: 'default' | 'compact';
}

export function SubscriptionDashboard({ variant = 'default' }: Props) {
  const {
    subscriptions,
    error,
    loading,
    retry,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    toggleSubscription,
    toggleAllSubscriptions,
    calculateSummary
  } = useSubscriptionStorage();

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg" />
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/10 text-red-900 dark:text-red-200">
        <h3 className="text-lg font-semibold mb-2">Error Loading Subscriptions</h3>
        <p className="text-sm mb-4 text-red-800 dark:text-red-300">
          {error.message}
        </p>
        <button
          onClick={retry}
          className="px-4 py-2 text-sm font-medium text-red-900 dark:text-red-200 bg-red-100 dark:bg-red-900/20 rounded-md hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Section title="Summary">
        <SubscriptionSummary summary={calculateSummary()} />
      </Section>

      <Section title="Your Subscriptions">
        <SubscriptionList
          subscriptions={subscriptions}
          onToggleSubscription={toggleSubscription}
          onToggleAll={toggleAllSubscriptions}
          onEdit={updateSubscription}
          onDelete={deleteSubscription}
        />
      </Section>
    </div>
  );
}
