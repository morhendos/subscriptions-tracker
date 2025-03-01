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
    
    try {
      await signOut({ 
        callbackUrl: '/login',
        redirect: true // Let NextAuth handle the redirect after signout completes
      });
    } catch (error) {
      console.error('Error signing out:', error);
      // Fallback redirection in case the signOut function fails
      router.push('/login');
    }
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={isSigningOut}
      aria-label="Sign out"
      className="flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground
        transition-colors duration-200 dark:text-foreground/60 dark:hover:text-foreground
        disabled:opacity-70 disabled:cursor-default"
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