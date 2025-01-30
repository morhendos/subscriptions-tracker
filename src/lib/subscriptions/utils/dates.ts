import { BillingPeriod } from '@/types/subscriptions';

/**
 * Calculate next billing date based on start date and billing period
 * @param startDate - Initial subscription date
 * @param billingPeriod - Billing frequency (MONTHLY, YEARLY)
 * @returns Next billing date as ISO string
 */
export function calculateNextBillingDate(startDate: string, billingPeriod: BillingPeriod): string {
  const date = new Date(startDate);
  const today = new Date();
  
  if (date > today) {
    return date.toISOString();
  }

  const timeDiff = today.getTime() - date.getTime();
  let periodInMs: number;

  switch (billingPeriod) {
    case 'MONTHLY':
      periodInMs = 30 * 24 * 60 * 60 * 1000;
      break;
    case 'YEARLY':
      periodInMs = 365 * 24 * 60 * 60 * 1000;
      break;
    default:
      return date.toISOString();
  }

  const periodsElapsed = Math.ceil(timeDiff / periodInMs);
  const nextBillingDate = new Date(date.getTime() + (periodsElapsed * periodInMs));

  return nextBillingDate.toISOString();
}