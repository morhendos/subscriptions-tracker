import { BillingPeriod } from '@/types/subscriptions';

export interface PeriodConfig {
  daysInPeriod: number;
  monthsInPeriod: number;
  label: string;
  description: string;
}

export const BILLING_PERIODS: Record<BillingPeriod, PeriodConfig> = {
  MONTHLY: {
    daysInPeriod: 30.437, // Average days in a month (365.25/12)
    monthsInPeriod: 1,
    label: 'Monthly',
    description: 'Billed every month',
  },
  YEARLY: {
    daysInPeriod: 365.25, // Account for leap years
    monthsInPeriod: 12,
    label: 'Yearly',
    description: 'Billed every year',
  },
} as const;

export const PERIOD_ORDER: BillingPeriod[] = ['MONTHLY', 'YEARLY'];

// Validation functions
export function isValidBillingPeriod(period: string): period is BillingPeriod {
  return period in BILLING_PERIODS;
}

export function getPeriodConfig(period: BillingPeriod): PeriodConfig {
  return BILLING_PERIODS[period];
}

export function getMonthlyMultiplier(period: BillingPeriod): number {
  const config = getPeriodConfig(period);
  return 1 / config.monthsInPeriod;
}
