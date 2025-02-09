'use client';

import { useSubscriptionStorage } from '@/lib/subscriptions/hooks/useSubscriptionStorage';
import { Section } from '@/components/common/Section';
import { SubscriptionList } from './SubscriptionList';
import { SubscriptionSummary } from './SubscriptionSummary';
import { AddSubscriptionSheet } from './AddSubscriptionSheet';
import { Subscription } from '@/types/subscriptions';

interface Props {
  variant?: 'default' | 'compact';
}

const layouts = {
  default: {
    container: "grid gap-8 mt-8 lg:grid-cols-12",
    list: "lg:col-span-5",
    content: "lg:col-span-7 space-y-8"
  },
  compact: {
    container: "grid gap-8 mt-8 lg:grid-cols-2",
    list: "space-y-8 lg:order-1",
    content: "lg:order-2"
  }
};

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
      <div className="grid gap-8 mt-8">
        <div className="h-[200px] animate-pulse rounded-lg bg-paper shadow-sm" />
        <div className="space-y-8">
          <div className="h-[400px] animate-pulse rounded-lg bg-paper shadow-sm" />
          <div className="h-[200px] animate-pulse rounded-lg bg-paper shadow-sm" />
        </div>
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

  // Handler for initial edit click (not the actual update)
  const handleEditClick = (subscription: Subscription) => {
    console.log('Edit subscription:', subscription);
  };

  const layout = layouts[variant];

  return (
    <div className={layout.container}>
      {variant === 'default' ? (
        // Default Layout (12-column grid)
        <>
          <div className={layout.list}>
            <Section 
              title="Your Subscriptions"
              action={
                <AddSubscriptionSheet 
                  onSubmit={addSubscription} 
                  variant="golden"
                />
              }
            >
              <SubscriptionList
                subscriptions={subscriptions}
                onEdit={handleEditClick}
                onUpdate={updateSubscription}
                onDelete={deleteSubscription}
                onToggleSubscription={toggleSubscription}
                onToggleAll={toggleAllSubscriptions}
                mounted={true}
              />
            </Section>
          </div>

          <div className={layout.content}>
            {subscriptions.length > 0 && (
              <div className="sticky top-4">
                <Section title="Summary">
                  <SubscriptionSummary summary={calculateSummary()} />
                </Section>
              </div>
            )}
          </div>
        </>
      ) : (
        // Compact Layout (2-column grid)
        <>
          <div className={layout.list}>
            {subscriptions.length > 0 && (
              <div className="sticky top-4">
                <Section title="Summary">
                  <SubscriptionSummary summary={calculateSummary()} />
                </Section>
              </div>
            )}

            <Section 
              title="Your Subscriptions"
              action={
                <AddSubscriptionSheet 
                  onSubmit={addSubscription} 
                  variant="golden"
                />
              }
            >
              <SubscriptionList
                subscriptions={subscriptions}
                onEdit={handleEditClick}
                onUpdate={updateSubscription}
                onDelete={deleteSubscription}
                onToggleSubscription={toggleSubscription}
                onToggleAll={toggleAllSubscriptions}
                mounted={true}
              />
            </Section>
          </div>

          <div className={layout.content} />
        </>
      )}
    </div>
  );
}