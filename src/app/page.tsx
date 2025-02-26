'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { data: session, status } = useSession();
  
  useEffect(() => {
    // For authenticated users, redirect to subscriptions
    if (status === 'authenticated') {
      window.location.href = '/subscriptions';
    } 
    // For unauthenticated users, redirect to login
    else if (status === 'unauthenticated') {
      window.location.href = '/login';
    }
  }, [status]);
  
  // While checking authentication, show loading indicator
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-gray-500" />
      <p className="mt-4 text-gray-500">Loading application...</p>
    </div>
  );
}