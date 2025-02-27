'use client';

import { useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

// Map technical error codes to user-friendly messages
const getErrorMessage = (errorCode: string | null): string => {
  if (!errorCode) return 'An error occurred during authentication';
  
  const errorMessages: Record<string, string> = {
    AccessDenied: 'Access denied. Please ensure you have the correct permissions.',
    Configuration: 'There is a problem with the authentication configuration.',
    CredentialsSignin: 'Invalid email or password. Please check your credentials and try again.',
    Default: 'An error occurred during authentication. Please try again.',
    OAuthSignin: 'Error starting the sign-in process. Please try again.',
    OAuthCallback: 'Error during the sign-in process. Please try again.',
    OAuthCreateAccount: 'Error creating an account. Please try again.',
    EmailCreateAccount: 'Error creating an account. Please try again.',
    Callback: 'Error during the sign-in process. Please try again.',
    OAuthAccountNotLinked: 'This email is already associated with another account.',
    EmailSignin: 'Error sending the sign-in email. Please try again.',
    SessionRequired: 'Please sign in to access this page.',
    Verification: 'The verification link was invalid or has expired. Please try again.'
  };

  return errorMessages[errorCode] || errorMessages.Default;
};

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const errorMessage = getErrorMessage(error);

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