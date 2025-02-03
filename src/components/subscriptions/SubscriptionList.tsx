'use client';

import { useMemo } from 'react';
import { Subscription } from '@/types/subscriptions';
import { formatCurrency } from '@/utils/format';
import { Pencil, Trash, CreditCard, EyeOff, Eye } from 'lucide-react';

interface SubscriptionListProps {
  subscriptions: Subscription[];
  onEdit: (subscription: Subscription) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onToggleAll: (enabled: boolean) => void;
  mounted?: boolean;
}

export function SubscriptionList({ 
  subscriptions, 
  onEdit, 
  onDelete, 
  onToggle,
  onToggleAll,
  mounted 
}: SubscriptionListProps) {
  if (!mounted) {
    return <div />;
  }

  const items = subscriptions || [];
  const activeCount = items.filter(sub => !sub.disabled).length;
  
  const sortedSubscriptions = useMemo(() => {
    return [...items].sort((a, b) => {
      const nextDateA = new Date(a.nextBillingDate || a.startDate);
      const nextDateB = new Date(b.nextBillingDate || b.startDate);
      return nextDateA.getTime() - nextDateB.getTime();
    });
  }, [items]);

  if (!items.length) {
    return <div className="text-center text-muted italic py-8">No subscriptions added yet</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
        <div className="text-sm text-muted">
          {activeCount} of {items.length} active
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onToggleAll(false)}
            className="flex items-center gap-1 px-2 py-1 text-sm text-muted hover:text-foreground transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Disable all subscriptions"
          >
            <EyeOff size={16} />
            <span className="hidden sm:inline">Disable All</span>
          </button>
          <button
            onClick={() => onToggleAll(true)}
            className="flex items-center gap-1 px-2 py-1 text-sm text-muted hover:text-foreground transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Enable all subscriptions"
          >
            <Eye size={16} />
            <span className="hidden sm:inline">Enable All</span>
          </button>
        </div>
      </div>

      {sortedSubscriptions.map((subscription) => (
        <div
          key={subscription.id}
          className={`bg-paper p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 
            transition-all duration-200 transform 
            ${subscription.disabled ? 'opacity-50' : ''} 
            cursor-pointer 
            hover:border-accent hover:border-2
            hover:bg-accent/5 dark:hover:bg-accent/10
            hover:shadow-md hover:scale-[1.01]
            dark:hover:border-accent`}
          onClick={() => onToggle(subscription.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onToggle(subscription.id);
            }
          }}
        >
          <div className="flex justify-between items-start gap-4">
            <div className="flex items-start gap-3">
              <div className={`mt-1 ${subscription.disabled ? 'text-muted' : 'text-accent dark:text-accent/90'}`}>
                <CreditCard size={20} />
              </div>
              <div>
                <h3 className={`font-semibold ${subscription.disabled ? 'text-muted line-through' : 'text-foreground'}`}>
                  {subscription.name}
                </h3>
                
                <div className="mt-1 text-muted text-sm">
                  {formatCurrency(subscription.price, subscription.currency)} per {subscription.billingPeriod}
                </div>

                {subscription.description && (
                  <div className="mt-2 text-sm text-muted">
                    {subscription.description}
                  </div>
                )}

                <div className="mt-2 text-xs text-muted">
                  Next billing: {new Date(subscription.nextBillingDate || subscription.startDate).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div 
              className="flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => onEdit(subscription)}
                className="p-2 text-muted hover:text-foreground transition-colors"
                title="Edit subscription"
              >
                <Pencil className="w-4 h-4" />
              </button>

              <button
                onClick={() => onDelete(subscription.id)}
                className="p-2 text-muted hover:text-red-500 dark:hover:text-red-400 transition-colors"
                title="Delete subscription"
              >
                <Trash className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}