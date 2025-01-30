import { BillingPeriod } from '@/types/subscriptions';
import { getPeriodConfig, isValidBillingPeriod } from '../config/periods';

/**
 * Convert an amount from one billing period to another
 * @param amount - Amount to convert
 * @param fromPeriod - Source billing period
 * @param toPeriod - Target billing period
 * @returns Converted amount
 * @throws Error if invalid period provided
 */
export function convertBetweenPeriods(
  amount: number,
  fromPeriod: BillingPeriod,
  toPeriod: BillingPeriod
): number {
  // Validate periods
  if (!isValidBillingPeriod(fromPeriod) || !isValidBillingPeriod(toPeriod)) {
    throw new Error(`Invalid billing period provided: ${fromPeriod} or ${toPeriod}`);
  }

  // If same period, return original amount
  if (fromPeriod === toPeriod) return amount;

  const fromConfig = getPeriodConfig(fromPeriod);
  const toConfig = getPeriodConfig(toPeriod);

  // Convert using months as the common denominator
  return amount * (toConfig.monthsInPeriod / fromConfig.monthsInPeriod);
}

/**
 * Calculate the next billing date based on the current date and billing period
 * @param startDate - Initial subscription date
 * @param billingPeriod - Billing frequency
 * @returns Next billing date as ISO string
 */
export function calculateNextBillingDate(
  startDate: string,
  billingPeriod: BillingPeriod
): string {
  const date = new Date(startDate);
  const today = new Date();
  
  // If start date is in the future, that's the next billing date
  if (date > today) {
    return date.toISOString();
  }

  const config = getPeriodConfig(billingPeriod);
  const timeDiff = today.getTime() - date.getTime();
  const periodInMs = config.daysInPeriod * 24 * 60 * 60 * 1000;
  
  // Calculate how many periods have elapsed and add one more
  const periodsElapsed = Math.ceil(timeDiff / periodInMs);
  const nextBillingDate = new Date(date.getTime() + (periodsElapsed * periodInMs));

  return nextBillingDate.toISOString();
}
