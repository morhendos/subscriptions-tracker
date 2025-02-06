"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { SubscriptionDashboard } from "@/components/subscriptions/SubscriptionDashboard";

export default function SubscriptionsPage() {
  return (
    <div className="min-h-screen transition-colors duration-200">
      <main className="container mx-auto px-3 py-4 sm:px-4 max-w-7xl">
        <PageHeader />
        <SubscriptionDashboard variant="default" />
      </main>
    </div>
  );
}
