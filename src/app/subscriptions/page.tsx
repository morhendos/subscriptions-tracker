"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { SubscriptionDashboard } from "@/components/subscriptions/SubscriptionDashboard";
import { DatabaseErrorBoundary } from "@/components/error/DatabaseErrorBoundary";
import { useEffect, useState } from 'react';

export default function SubscriptionsPage() {
  const [retryKey, setRetryKey] = useState(0);

  const handleRetry = () => {
    setRetryKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen transition-colors duration-200">
      <main className="container mx-auto px-3 py-4 sm:px-4 max-w-7xl">
        <PageHeader />
        <DatabaseErrorBoundary onRetry={handleRetry}>
          <SubscriptionDashboard 
            key={retryKey}
            variant="default" 
          />
        </DatabaseErrorBoundary>
      </main>
    </div>
  );
}
