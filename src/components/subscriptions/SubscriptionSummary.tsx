'use client';

import { Currency, SubscriptionSummary as Summary } from '@/types/subscriptions';
import { formatCurrency } from '@/utils/format';

interface SubscriptionSummaryProps {
  summary: Summary;
}

export function SubscriptionSummary({ summary }: SubscriptionSummaryProps) {
  const hasOriginalAmounts = Object.values(summary.originalAmounts).some(amount => amount > 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SummaryCard
          title="Monthly"
          amount={summary.totalMonthly}
          period="per month"
        />
        <SummaryCard
          title="Yearly"
          amount={summary.totalYearly}
          period="per year"
        />
      </div>

      {hasOriginalAmounts && (
        <div className="bg-paper dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-medium text-muted mb-3">Original Currency Amounts</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Object.entries(summary.originalAmounts)
              .filter(([_, amount]) => amount > 0)
              .map(([currency, amount]) => (
                <div key={currency}>
                  <p className="text-lg font-semibold journal-text text-foreground">
                    {formatCurrency(amount, currency as Currency)}
                  </p>
                  <p className="text-sm text-muted">Total in {currency}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-6 text-center">
        <h3 className="text-lg font-medium journal-text mb-2 text-foreground">
          Total Monthly Spending
        </h3>
        <p className="text-2xl font-semibold text-indigo-600 dark:text-indigo-400">
          {formatCurrency(summary.grandTotalMonthly, 'EUR')}
        </p>
        <p className="text-sm text-muted mt-1">
          All subscriptions converted to EUR monthly rate
        </p>
      </div>
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  amount: number;
  period: string;
}

function SummaryCard({ title, amount, period }: SummaryCardProps) {
  return (
    <div className="bg-paper dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <h4 className="text-sm font-medium text-muted mb-1">{title}</h4>
      <p className="text-xl font-semibold journal-text text-foreground">{formatCurrency(amount, 'EUR')}</p>
      <p className="text-sm text-muted">{period}</p>
    </div>
  );
}