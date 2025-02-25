"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { SubscriptionDashboard } from "@/components/subscriptions/SubscriptionDashboard";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// The actual dashboard content
function DashboardContent() {
  return (
    <div className="min-h-screen transition-colors duration-200">
      <main className="container mx-auto px-3 py-4 sm:px-4 max-w-7xl">
        <PageHeader />
        <SubscriptionDashboard variant="default" />
      </main>
    </div>
  );
}

// Custom loading component for the subscription page
function SubscriptionLoading() {
  return (
    <div className="min-h-screen transition-colors duration-200">
      <main className="container mx-auto px-3 py-4 sm:px-4 max-w-7xl">
        <div className="animate-pulse">
          {/* Header loading state */}
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-md mb-8 w-48"></div>
          
          {/* Dashboard loading state */}
          <div className="grid gap-8 mt-8 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-96"></div>
            </div>
            <div className="lg:col-span-7 space-y-8">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-64"></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Wrap the dashboard with protection
export default function SubscriptionsPage() {
  return (
    <ProtectedRoute loadingComponent={<SubscriptionLoading />}>
      <DashboardContent />
    </ProtectedRoute>
  );
}