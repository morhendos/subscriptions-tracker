'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { LogOut, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    // Immediately show visual feedback
    setIsSigningOut(true);

    // Optimistically redirect to login page
    // Let the authentication cleanup happen in the background
    router.push('/login');

    // Process actual signout in the background
    try {
      await signOut({ 
        callbackUrl: '/login',
        redirect: false // Prevent NextAuth's redirect as we're handling it manually
      });
    } catch (error) {
      console.error('Error signing out:', error);
      // Even if there's an error, we're already redirecting to login
    }
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={isSigningOut}
      aria-label="Sign out"
      className="flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground
        transition-colors duration-200 dark:text-foreground/60 dark:hover:text-foreground
        disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {isSigningOut ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <LogOut size={18} strokeWidth={1.5} />
      )}
      <span>{isSigningOut ? 'Signing out...' : 'Sign Out'}</span>
    </button>
  );
}