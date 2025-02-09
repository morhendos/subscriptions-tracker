'use client';

import { Button } from '@/components/ui/button';

export default function SubscriptionsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="h-screen flex items-center justify-center">
      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/10 text-red-900 dark:text-red-200 max-w-md">
        <h2 className="text-lg font-semibold mb-2">Something went wrong!</h2>
        <p className="text-sm mb-4 text-red-800 dark:text-red-300">
          {error.message}
        </p>
        <Button onClick={reset} variant="secondary" size="sm">
          Try again
        </Button>
      </div>
    </div>
  );
}
