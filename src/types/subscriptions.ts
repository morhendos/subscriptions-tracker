import { z } from 'zod';

export type Currency = 'USD' | 'EUR' | 'GBP';
export type BillingPeriod = 'MONTHLY' | 'YEARLY';
export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED';

export type SubscriptionFormData = {
  name: string;
  price: number;
  currency: Currency;
  billingPeriod: BillingPeriod;
  startDate: string;
  description?: string;
};

export type Subscription = SubscriptionFormData & {
  id: string;
  nextBillingDate: string;
  disabled: boolean;
  createdAt: string;
  updatedAt: string;
};
