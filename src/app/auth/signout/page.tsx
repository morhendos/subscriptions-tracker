'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SignOutPage() {
  const router = useRouter();

  useEffect(() => {
    // Immediately start redirect to login page
    const redirectTimeout = setTimeout(() => {
      router.push('/login');
    }, 500); // Short delay for animation but fast enough for good UX

    // Handle actual signout in the background
    const handleSignOut = async () => {
      try {
        await signOut({ 
          callbackUrl: '/login',
          redirect: false // We're handling redirection manually for better UX
        });
      } catch (error) {
        console.error('Error signing out:', error);
        // Even if there's an error, we still redirect to login
      }
    };
    
    handleSignOut();

    return () => clearTimeout(redirectTimeout);
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="flex flex-col items-center space-y-4">
        <LogOut className="h-8 w-8 text-muted-foreground animate-pulse" />
        <p className="text-muted-foreground">Redirecting to login...</p>
      </div>
    </div>
  );
}