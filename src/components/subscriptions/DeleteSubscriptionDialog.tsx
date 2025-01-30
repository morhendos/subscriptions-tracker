'use client';

import { useState } from 'react';
import { Subscription } from '@/types/subscriptions';

interface DeleteSubscriptionDialogProps {
  subscription: Subscription;
  onSuccess: () => void;
}

export function DeleteSubscriptionDialog({
  subscription,
  onSuccess,
}: DeleteSubscriptionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      onSuccess();
      setIsOpen(false);
    } catch (error) {
      console.error('Error deleting subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 hover:bg-red-500/10 rounded-md transition-colors"
      >
        Delete
      </button>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-paper p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">Delete Subscription</h2>
            <p className="mb-6">Are you sure you want to delete {subscription.name}?</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={handleCancel}
                className="flex-1 bg-paper text-ink/70 hover:text-ink
                  py-3 px-6 rounded-md transition-all duration-200 
                  flex items-center justify-center gap-2 group journal-text journal-button"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-500/10 text-red-500 hover:bg-red-500/15
                  py-3 px-6 rounded-md transition-all duration-200
                  flex items-center justify-center gap-2 group journal-text journal-button"
                disabled={isLoading}
              >
                {isLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}