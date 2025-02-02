'use client';

import { useState } from 'react';
import { Section } from '@/components/common/Section';
import { PageHeader } from '@/components/layout/PageHeader';
import { SubscriptionForm } from './SubscriptionForm';
import { SubscriptionList } from './SubscriptionList';
import { SubscriptionSummary } from './SubscriptionSummary';
import { Subscription, SubscriptionFormData } from '@/types/subscriptions';
import { useSubscriptionStorage } from '@/lib/subscriptions/storage';

export interface SubscriptionDashboardProps {
  variant?: 'default' | 'compact';
}

export function SubscriptionDashboard({ variant = 'default' }: SubscriptionDashboardProps) {
  const {
    subscriptions,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    toggleSubscription,
    toggleAllSubscriptions,
    calculateSummary,
    mounted
  } = useSubscriptionStorage();

  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);

  const handleSubmit = (data: SubscriptionFormData) => {
    if (editingSubscription) {
      updateSubscription(editingSubscription.id, data);
      setEditingSubscription(null);
    } else {
      addSubscription(data);
    }
  };

  const handleEdit = (subscription: Subscription) => {
    setEditingSubscription(subscription);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this subscription?')) {
      deleteSubscription(id);
      if (editingSubscription?.id === id) {
        setEditingSubscription(null);
      }
    }
  };

  const handleToggle = (id: string) => {
    toggleSubscription(id);
    if (editingSubscription?.id === id) {
      setEditingSubscription(null);
    }
  };

  const handleToggleAll = (enabled: boolean) => {
    toggleAllSubscriptions(enabled);
    setEditingSubscription(null);
  };

  const handleCancel = () => {
    setEditingSubscription(null);
  };

  if (!mounted) {
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

  const layouts = {
    default: {
      container: "grid gap-8 mt-8 lg:grid-cols-12",
      list: "lg:col-span-5",
      form: "lg:col-span-7 space-y-8"
    },
    compact: {
      container: "grid gap-8 mt-8 lg:grid-cols-2",
      list: "space-y-8 lg:order-1",
      form: "lg:order-2"
    }
  };

  const layout = layouts[variant];

  return (
    <div className={layout.container}>
      {variant === 'default' ? (
        // Default Layout (12-column grid)
        <>
          <div className={layout.list}>
            <Section title="Your Subscriptions">
              <SubscriptionList
                subscriptions={subscriptions}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggle={handleToggle}
                onToggleAll={handleToggleAll}
                mounted={mounted}
              />
            </Section>
          </div>

          <div className={layout.form}>
            <Section
              title={editingSubscription ? 'Edit Subscription' : 'Add New Subscription'}
            >
              <SubscriptionForm
                onSubmit={handleSubmit}
                onCancel={editingSubscription ? handleCancel : undefined}
                initialData={editingSubscription || undefined}
              />
            </Section>

            {subscriptions.length > 0 && (
              <div className="lg:sticky lg:top-4">
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
              <Section title="Summary">
                <SubscriptionSummary summary={calculateSummary()} />
              </Section>
            )}

            <Section title="Your Subscriptions">
              <SubscriptionList
                subscriptions={subscriptions}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggle={handleToggle}
                onToggleAll={handleToggleAll}
                mounted={mounted}
              />
            </Section>
          </div>

          <Section
            title={editingSubscription ? 'Edit Subscription' : 'Add New Subscription'}
            className={layout.form}
          >
            <SubscriptionForm
              onSubmit={handleSubmit}
              onCancel={editingSubscription ? handleCancel : undefined}
              initialData={editingSubscription || undefined}
            />
          </Section>
        </>
      )}
    </div>
  );
}