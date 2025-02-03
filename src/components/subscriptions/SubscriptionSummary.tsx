'use client';

import React from 'react';
import { Wallet, CalendarDays, CreditCard } from 'lucide-react';
import { Currency } from '@/types/subscriptions';

interface SummaryData {
  totalMonthly: number;
  totalYearly: number;
  grandTotalMonthly: number;
  originalAmounts: Record<Currency, number>;
}

interface SubscriptionSummaryProps {
  summary?: SummaryData;
}

export function SubscriptionSummary({ summary }: SubscriptionSummaryProps) {
  // Early return with loading state if summary is not available
  if (!summary) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-paper p-6 rounded-xl border border-gray-200 dark:border-gray-700 h-32" />
          <div className="bg-paper p-6 rounded-xl border border-gray-200 dark:border-gray-700 h-32" />
        </div>
        <div className="bg-paper rounded-xl border border-gray-200 dark:border-gray-700 p-6 h-48" />
        <div className="bg-paper rounded-xl border border-gray-200 dark:border-gray-700 p-6 h-32" />
      </div>
    );
  }

  const hasOriginalAmounts = Object.entries(summary.originalAmounts)
    .some(([_, amount]) => amount > 0);

  return (
    <div className="space-y-6">
      {/* Main spending metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-paper p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-accent/5 dark:bg-accent/10 rounded-lg">
              <CalendarDays className="w-6 h-6 text-accent dark:text-accent/90" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted">Monthly</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                {summary.grandTotalMonthly.toFixed(2)} €
              </h3>
              <p className="text-sm text-muted mt-1">per month</p>
            </div>
          </div>
        </div>

        <div className="bg-paper p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-accent/5 dark:bg-accent/10 rounded-lg">
              <Wallet className="w-6 h-6 text-accent dark:text-accent/90" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted">Yearly</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                {summary.totalYearly.toFixed(2)} €
              </h3>
              <p className="text-sm text-muted mt-1">per year</p>
            </div>
          </div>
        </div>
      </div>

      {/* Currency breakdown - only show if there are non-zero amounts */}
      {hasOriginalAmounts && (
        <div className="bg-paper rounded-xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-muted" />
            <h3 className="text-lg font-semibold text-foreground">Original Currency Amounts</h3>
          </div>
          
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(summary.originalAmounts)
              .filter(([_, amount]) => amount > 0)
              .map(([currency, amount]) => (
                <div 
                  key={currency} 
                  className="bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700 p-4 relative overflow-hidden shadow-sm"
                >
                  <div className="relative z-10">
                    <div className="text-lg font-bold text-foreground">
                      {amount.toFixed(2)} {currency === 'PLN' ? 'zł' : currency === 'USD' ? '$' : '€'}
                    </div>
                    <div className="text-sm text-muted mt-1">
                      Total in {currency}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Total monthly converted */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-accent/20 dark:border-gray-700 shadow-sm">
        <h3 className="text-center text-lg font-medium text-foreground">
          Total Monthly Spending
        </h3>
        <div className="text-center mt-2 text-3xl font-bold text-yellow-600/90 dark:text-yellow-500">
          {summary.grandTotalMonthly.toFixed(2)} €
        </div>
        <p className="text-center mt-2 text-sm text-muted">
          All subscriptions converted to EUR monthly rate
        </p>
      </div>
    </div>
  );
}