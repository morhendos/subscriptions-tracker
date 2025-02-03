import { BillingPeriod } from "@/types/subscriptions";

export function calculateNextBillingDate(startDate: string, billingPeriod: BillingPeriod): string {
  const start = new Date(startDate);
  const now = new Date();
  let nextBilling = new Date(startDate);

  // If billing period is monthly, add months until we find a future date
  if (billingPeriod === 'MONTHLY') {
    while (nextBilling <= now) {
      nextBilling.setMonth(nextBilling.getMonth() + 1);
    }
  }
  // If billing period is yearly, add years until we find a future date
  else if (billingPeriod === 'YEARLY') {
    while (nextBilling <= now) {
      nextBilling.setFullYear(nextBilling.getFullYear() + 1);
    }
  }

  return nextBilling.toISOString().split('T')[0];
}

export function updateNextBillingDateIfNeeded(
  nextBillingDate: string, 
  startDate: string, 
  billingPeriod: BillingPeriod
): string {
  const current = new Date(nextBillingDate);
  const now = new Date();

  // If next billing date is in the past, recalculate it
  if (current < now) {
    return calculateNextBillingDate(startDate, billingPeriod);
  }

  return nextBillingDate;
}