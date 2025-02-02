'use client';

import { useState } from 'react';
import { Section } from '@/components/common/Section';
import { PageHeader } from '@/components/layout/PageHeader';
import { SubscriptionForm } from '@/components/subscriptions/SubscriptionForm';
import { SubscriptionList } from '@/components/subscriptions/SubscriptionList';
import { SubscriptionSummary } from '@/components/subscriptions/SubscriptionSummary';
import { Subscription, SubscriptionFormData } from '@/types/subscriptions';
import { useSubscriptionStorage } from '@/lib/subscriptions/storage';

export default function SubscriptionsPage() {
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

  const handleCancel = () => {
    setEditingSubscription(null);
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-200">
      <main className="container mx-auto px-3 py-4 sm:px-4 sm:py-12 max-w-6xl">
        <PageHeader />
        
        <div className="grid gap-8 mt-8 lg:grid-cols-2">
          <Section
            title={editingSubscription ? 'Edit Subscription' : 'Add New Subscription'}
            className="lg:order-3"
          >
            <SubscriptionForm
              onSubmit={handleSubmit}
              onCancel={editingSubscription ? handleCancel : undefined}
              initialData={editingSubscription || undefined}
            />
          </Section>

          <div className="space-y-8 lg:order-1">
            {subscriptions?.length > 0 && (
              <Section title="Summary">
                <SubscriptionSummary summary={calculateSummary()} />
              </Section>
            )}

            <Section title="Your Subscriptions">
              <SubscriptionList
                subscriptions={subscriptions || []}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggle={toggleSubscription}
                onToggleAll={toggleAllSubscriptions}
                mounted={mounted}
              />
            </Section>
          </div>
        </div>
      </main>
    </div>
  );
}