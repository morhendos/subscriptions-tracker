'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AUTH_CONFIG } from '@/lib/auth/config';
import { AuthenticatingSpinner } from '@/components/auth/AuthenticatingSpinner';

export default function HomePage() {
  const { status } = useSession();
  const [isClient, setIsClient] = useState(false);
  
  // Use useEffect to ensure we're on the client before redirecting
  useEffect(() => {
    setIsClient(true);
    
    // Only redirect when we know the authentication status
    if (isClient) {
      if (status === 'authenticated') {
        // Redirect to subscriptions if logged in
        redirect('/subscriptions');
      } else if (status === 'unauthenticated') {
        // Redirect to login if not logged in
        redirect(AUTH_CONFIG.ROUTES.signIn);
      }
    }
  }, [status, isClient]);

  // Show loading spinner while checking authentication
  return <AuthenticatingSpinner />;
}
