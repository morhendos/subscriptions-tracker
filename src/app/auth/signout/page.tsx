'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export default function SignOutPage() {
  useEffect(() => {
    const handleSignOut = async () => {
      await signOut({ callbackUrl: '/login' });
    };
    handleSignOut();
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="flex flex-col items-center space-y-4">
        <LogOut className="h-8 w-8 text-muted-foreground animate-pulse" />
        <p className="text-muted-foreground">Signing out...</p>
      </div>
    </div>
  );
}