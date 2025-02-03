'use client';

import React from 'react';
import { ArrowDown, Wallet, CalendarDays, CreditCard } from 'lucide-react';

interface SummaryData {
  monthly: number;
  yearly: number;
  originalAmounts: {
    [key: string]: number;
  };
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

  return (
    <div className="space-y-6">
      {/* Main spending metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-paper p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <CalendarDays className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted">Monthly</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                {(summary.monthly || 0).toFixed(2)} €
              </h3>
              <p className="text-sm text-muted mt-1">per month</p>
            </div>
          </div>
        </div>

        <div className="bg-paper p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <Wallet className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted">Yearly</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                {(summary.yearly || 0).toFixed(2)} €
              </h3>
              <p className="text-sm text-muted mt-1">per year</p>
            </div>
          </div>
        </div>
      </div>

      {/* Currency breakdown */}
      <div className="bg-paper rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-muted" />
          <h3 className="text-lg font-semibold text-foreground">Original Currency Amounts</h3>
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
          {Object.entries(summary.originalAmounts || {}).map(([currency, amount]) => (
            <div key={currency} className="p-4 bg-accent/5 dark:bg-accent/10 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-lg font-bold text-foreground">
                {(amount || 0).toFixed(2)} {currency === 'PLN' ? 'zł' : currency === 'USD' ? '$' : '€'}
              </div>
              <div className="text-sm text-muted mt-1">
                Total in {currency}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Total monthly converted */}
      <div className="bg-accent/5 dark:bg-accent/10 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-center text-lg font-medium text-foreground">
          Total Monthly Spending
        </h3>
        <div className="text-center mt-2 text-3xl font-bold text-accent dark:text-accent/90">
          {(summary.monthly || 0).toFixed(2)} €
        </div>
        <p className="text-center mt-2 text-sm text-muted">
          All subscriptions converted to EUR monthly rate
        </p>
      </div>
    </div>
  );
}