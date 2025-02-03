'use client';

import { BillingPeriod } from '@/types/subscriptions';

export function calculateNextBillingDate(startDate: string, billingPeriod: BillingPeriod): string {
  const start = new Date(startDate);
  const now = new Date();
  
  // If start date is in the future, that's our first billing date
  if (start > now) {
    return start.toISOString();
  }

  // Calculate the next billing date based on the period
  const nextDate = new Date(startDate);
  
  // Keep incrementing until we find a future date
  while (nextDate <= now) {
    if (billingPeriod === 'MONTHLY') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else if (billingPeriod === 'YEARLY') {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    }
  }
  
  return nextDate.toISOString();
}

export function calculateNextBillingDateFromPast(
  startDate: string,
  billingPeriod: BillingPeriod,
  lastBillingDate: string
): string {
  const start = new Date(startDate);
  const lastBilling = new Date(lastBillingDate);
  const now = new Date();
  
  // If last billing is in the future, keep it
  if (lastBilling > now) {
    return lastBilling.toISOString();
  }

  // Calculate the next billing date from the last one
  const nextDate = new Date(lastBillingDate);
  
  // Keep incrementing until we find a future date
  while (nextDate <= now) {
    if (billingPeriod === 'MONTHLY') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else if (billingPeriod === 'YEARLY') {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    }
  }
  
  return nextDate.toISOString();
}