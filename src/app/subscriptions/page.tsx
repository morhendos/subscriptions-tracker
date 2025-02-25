"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { SubscriptionDashboard } from "@/components/subscriptions/SubscriptionDashboard";

export default function SubscriptionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Redirect to login if not authenticated
  // This is a backup to the middleware protection
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/subscriptions');
    }
  }, [status, router]);
  
  // Show loading state while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center transition-colors duration-200">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-10 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
          <div className="h-64 w-full max-w-3xl bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }
  
  // If not authenticated, don't render anything (will be redirected by the useEffect)
  if (status === 'unauthenticated') {
    return null;
  }

  // Render dashboard for authenticated users
  return (
    <div className="min-h-screen transition-colors duration-200">
      <main className="container mx-auto px-3 py-4 sm:px-4 max-w-7xl">
        <PageHeader />
        <SubscriptionDashboard variant="default" />
      </main>
    </div>
  );
}