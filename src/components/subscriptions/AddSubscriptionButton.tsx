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
      className={`w-full bg-accent/10 text-accent hover:bg-accent/15 py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 group ${className}`}
      title="Add new subscription"
    >
      <Plus size={20} className="group-hover:scale-110 transition-transform" />
      <span className="font-medium">Add New Subscription</span>
    </button>
  );
}
