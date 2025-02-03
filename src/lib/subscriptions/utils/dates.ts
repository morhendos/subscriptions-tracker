'use client';

import { BillingPeriod } from '@/types/subscriptions';

/**
 * Calculates the next billing date for a subscription based on its start date and billing period.
 * If the start date is in the future, uses that as the first billing date.
 * Otherwise, calculates the next occurrence of the billing cycle that's in the future.
 * 
 * @param startDate - The subscription's start date in ISO format
 * @param billingPeriod - The billing period (MONTHLY or YEARLY)
 * @returns The next billing date in ISO format
 */
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

/**
 * Calculates the next billing date from a past billing date.
 * Used to update stale next billing dates without changing the billing cycle.
 * 
 * Example:
 * If a monthly subscription started on Jan 1st and its last billing was Apr 1st,
 * but it hasn't been updated since then, this function will calculate the next
 * billing date keeping the same day of the month (1st).
 * 
 * @param startDate - The subscription's original start date in ISO format
 * @param billingPeriod - The billing period (MONTHLY or YEARLY)
 * @param lastBillingDate - The last calculated billing date in ISO format
 * @returns The next billing date in ISO format
 */
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
  // This preserves the day of month/year from the last billing date
  while (nextDate <= now) {
    if (billingPeriod === 'MONTHLY') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else if (billingPeriod === 'YEARLY') {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    }
  }
  
  return nextDate.toISOString();
}