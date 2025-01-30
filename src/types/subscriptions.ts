export type BillingPeriod = 'monthly' | 'yearly' | 'weekly' | 'quarterly';
export type Currency = 'USD' | 'EUR' | 'PLN';

export interface Subscription {
  id: string;
  name: string;
  price: number;
  currency: Currency;
  billingPeriod: BillingPeriod;
  startDate: string; // ISO date string
  description?: string;
  nextBillingDate?: string; // ISO date string
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface SubscriptionFormData {
  name: string;
  price: number;
  currency: Currency;
  billingPeriod: BillingPeriod;
  startDate: string;
  description?: string;
}

export interface SubscriptionSummary {
  totalMonthly: number;
  totalYearly: number;
  totalWeekly: number;
  totalQuarterly: number;
  grandTotalMonthly: number; // All subscriptions converted to EUR monthly rate
  originalAmounts: {
    [key in Currency]: number;
  };
}

// Fixed exchange rates (in real app this would come from an API)
export const EXCHANGE_RATES = {
  EUR: 1,
  USD: 0.92, // 1 USD = 0.92 EUR
  PLN: 0.23  // 1 PLN = 0.23 EUR
} as const;