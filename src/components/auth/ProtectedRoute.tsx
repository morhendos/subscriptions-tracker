'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ComponentType, ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  loadingComponent?: ReactNode;
}

/**
 * Component that protects routes requiring authentication
 * Redirects to login page if user is not authenticated
 */
export function ProtectedRoute({ 
  children, 
  loadingComponent 
}: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      const returnUrl = encodeURIComponent(window.location.pathname);
      router.push(`/login?callbackUrl=${returnUrl}`);
    }
  }, [status, router]);

  if (status === 'loading') {
    return loadingComponent ? (
      <>{loadingComponent}</>
    ) : (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-10 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
          <div className="h-64 w-full max-w-3xl bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null; // Don't render anything, will be redirected
  }

  return <>{children}</>;
}

/**
 * HOC to wrap a component with authentication protection
 * @param Component - The component to protect
 * @param loadingComponent - Optional custom loading component
 */
export function withProtection<P extends object>(
  Component: ComponentType<P>,
  loadingComponent?: ReactNode
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute loadingComponent={loadingComponent}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}