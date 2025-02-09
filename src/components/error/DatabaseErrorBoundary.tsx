'use client';

import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { StorageError } from '@/lib/storage/types';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class DatabaseErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const error = this.state.error;
      const isStorageError = error instanceof StorageError;
      
      return (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/10 text-red-900 dark:text-red-200">
          <h3 className="text-lg font-semibold mb-2">
            {isStorageError ? 'Database Error' : 'Something went wrong'}
          </h3>
          <p className="text-sm mb-4 text-red-800 dark:text-red-300">
            {isStorageError 
              ? this.getStorageErrorMessage(error as StorageError)
              : 'An unexpected error occurred while accessing your data.'}
          </p>
          <div className="flex gap-2">
            <Button
              onClick={this.handleRetry}
              variant="secondary"
              size="sm"
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }

  private getStorageErrorMessage(error: StorageError): string {
    switch (error.code) {
      case 'storage_unavailable':
        return 'Unable to connect to the database. Please check your connection.';
      case 'read_error':
        return 'Failed to read your subscription data. Please try again.';
      case 'write_error':
        return 'Failed to save your changes. Please try again.';
      default:
        return error.message;
    }
  }
}
