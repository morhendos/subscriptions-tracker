"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { SubscriptionDashboard } from "@/components/subscriptions/SubscriptionDashboard";
import { TestStorageConnection } from "@/components/subscriptions/TestStorageConnection";

export default function SubscriptionsPage() {
  return (
    <div className="min-h-screen transition-colors duration-200">
      <main className="container mx-auto px-3 py-4 sm:px-4 max-w-7xl">
        <PageHeader />
        <TestStorageConnection />
        <SubscriptionDashboard variant="default" />
      </main>
    </div>
  );
}
