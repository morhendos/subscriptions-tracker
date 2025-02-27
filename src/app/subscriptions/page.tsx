"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { SubscriptionDashboard } from "@/components/subscriptions/SubscriptionDashboard";
import withAuth from "@/components/auth/withAuth";

function SubscriptionsPage() {
  return (
    <div className="min-h-screen transition-colors duration-200">
      <main className="container mx-auto px-3 py-4 sm:px-4 max-w-7xl">
        <PageHeader />
        <SubscriptionDashboard variant="default" />
      </main>
    </div>
  );
}

// Export the protected version of the page
export default withAuth(SubscriptionsPage);
