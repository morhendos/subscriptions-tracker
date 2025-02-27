'use client';

import React from 'react';

/**
 * A simple loading spinner component displayed during authentication checks
 */
export function AuthenticatingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-12 rounded-full border-t-2 border-b-2 border-primary animate-spin"></div>
        <p className="text-sm text-muted-foreground">Checking authentication...</p>
      </div>
    </div>
  );
}
