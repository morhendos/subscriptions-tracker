'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { AUTH_CONFIG } from '@/lib/auth/config';
import { useEffect, useState } from 'react';

/**
 * Higher-order component that protects routes by requiring authentication
 * Redirects to login page if user is not authenticated
 */
export default function withAuth<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return function ProtectedRoute(props: P) {
    const { data: session, status } = useSession();
    const [isClient, setIsClient] = useState(false);

    // Use useEffect to ensure we're on the client before redirecting
    useEffect(() => {
      setIsClient(true);
    }, []);

    // Show nothing while loading to prevent flash of content
    if (status === 'loading' || !isClient) {
      return null; 
    }

    // Redirect to login if not authenticated
    if (status === 'unauthenticated') {
      redirect(AUTH_CONFIG.ROUTES.signIn);
    }

    // User is authenticated, render the protected component
    return <Component {...props} />;
  };
}
