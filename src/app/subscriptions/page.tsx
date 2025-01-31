'use client';

import { useState } from 'react';
import { Section } from '@/components/common/Section';
import { PageHeader } from '@/components/layout/PageHeader';
import { SubscriptionForm } from '@/components/subscriptions/SubscriptionForm';
import { SubscriptionList } from '@/components/subscriptions/SubscriptionList';
import { SubscriptionSummary } from '@/components/subscriptions/SubscriptionSummary';
import { AddSubscriptionButton } from '@/components/subscriptions/AddSubscriptionButton';
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
  const [isFormVisible, setIsFormVisible] = useState(false);

  const handleSubmit = (data: SubscriptionFormData) => {
    if (editingSubscription) {
      updateSubscription(editingSubscription.id, data);
      setEditingSubscription(null);
    } else {
      addSubscription(data);
      setIsFormVisible(false);
    }
  };

  const handleEdit = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setIsFormVisible(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this subscription?')) {
      deleteSubscription(id);
      if (editingSubscription?.id === id) {
        setEditingSubscription(null);
        setIsFormVisible(false);
      }
    }
  };

  const handleCancel = () => {
    setEditingSubscription(null);
    setIsFormVisible(false);
  };

  const handleAddNew = () => {
    setEditingSubscription(null);
    setIsFormVisible(true);
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-200">
      <main className="container mx-auto px-3 py-4 sm:px-4 sm:py-12 max-w-6xl">
        <PageHeader />
        
        <div className="grid gap-8 mt-8 lg:grid-cols-2">
          {/* Form Section */}
          <div className={`transition-all duration-300 ease-in-out lg:order-2 ${!isFormVisible && !editingSubscription ? 'hidden' : ''}`}>
            <Section
              title={editingSubscription ? 'Edit Subscription' : 'Add New Subscription'}
            >
              <SubscriptionForm
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                initialData={editingSubscription || undefined}
              />
            </Section>
          </div>

          {/* Main Content */}
          <div className="space-y-8 lg:order-1">
            <Section title="Your Subscriptions">
              <div className="space-y-6">
                {!isFormVisible && !editingSubscription && (
                  <AddSubscriptionButton onClick={handleAddNew} />
                )}
                <SubscriptionList
                  subscriptions={subscriptions || []}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggle={toggleSubscription}
                  onToggleAll={toggleAllSubscriptions}
                  mounted={mounted}
                />
              </div>
            </Section>

            {subscriptions?.length > 0 && (
              <Section title="Summary">
                <SubscriptionSummary summary={calculateSummary()} />
              </Section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}