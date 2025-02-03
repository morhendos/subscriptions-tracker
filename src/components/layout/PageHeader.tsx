'use client';

import { HeaderControls } from '../settings/HeaderControls';
import LogoutButton from '../auth/LogoutButton';
import { CreditCard } from 'lucide-react';

export function PageHeader() {
  return (
    <header className="animate-fade-in border-b border-gray-100 dark:border-gray-800">
      <div className="container mx-auto">
        <div className="flex h-16 items-center justify-between px-4">
          {/* Left side */}
          <div className="flex items-center gap-2">
            <LogoutButton />
          </div>

          {/* Center - logo and title */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-lg bg-accent/10 dark:bg-accent/20">
              <CreditCard className="w-5 h-5 text-accent dark:text-accent/90" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
              Subscription Tracker
            </h1>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <HeaderControls />
          </div>
        </div>
      </div>

      {/* Gradient divider */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
    </header>
  );
}