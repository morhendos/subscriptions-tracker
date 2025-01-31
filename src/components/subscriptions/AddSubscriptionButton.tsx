'use client';

import { Plus } from 'lucide-react';

interface AddSubscriptionButtonProps {
  onClick: () => void;
  className?: string;
}

export function AddSubscriptionButton({ onClick, className = '' }: AddSubscriptionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`group flex items-center justify-center w-full gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 bg-paper hover:bg-accent/5 text-muted hover:text-accent border border-gray-200 dark:border-gray-700 hover:border-accent dark:hover:border-accent rounded-lg ${className}`}
    >
      <Plus 
        size={18} 
        className="transition-transform group-hover:scale-110 group-hover:rotate-90"
      />
      <span>Add New Subscription</span>
    </button>
  );
}
