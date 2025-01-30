'use client';

import { useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  let errorMessage = 'An error occurred during authentication';
  if (error === 'AccessDenied') {
    errorMessage = 'Access denied. Please ensure you have the correct permissions.';
  } else if (error === 'Configuration') {
    errorMessage = 'There is a problem with the authentication configuration.';
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-6 border border-border">
        <div className="flex items-center space-x-3 mb-6">
          <AlertCircle className="h-6 w-6 text-destructive" />
          <h1 className="text-xl font-semibold">Authentication Error</h1>
        </div>

        <p className="text-muted-foreground mb-6">{errorMessage}</p>

        <div className="space-y-4">
          <Link
            href="/login"
            className="block w-full py-2 px-4 text-center bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Return to Login
          </Link>
          <Link
            href="/"
            className="block w-full py-2 px-4 text-center bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
}