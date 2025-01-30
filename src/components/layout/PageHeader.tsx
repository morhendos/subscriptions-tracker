'use client';

import { HeaderControls } from '../settings/HeaderControls';
import LogoutButton from '../auth/LogoutButton';

export function PageHeader() {
  return (
    <div className="mb-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div className="w-32">
          <LogoutButton />
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground dark:text-foreground tracking-tight">
          Subscription Tracker
        </h1>
        <div className="w-32">
          <HeaderControls />
        </div>
      </div>
    </div>
  );
}