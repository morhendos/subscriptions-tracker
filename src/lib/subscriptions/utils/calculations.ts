import { Subscription, SubscriptionSummary, Currency } from '@/types/subscriptions';
import { convertToBaseCurrency, convertCurrency } from './currency';
import { convertBetweenPeriods } from './periods';
import { getCurrencyConfig, roundAmount } from '../config/currencies';

/**
 * Calculate subscription summary with total costs for different periods
 * @param subscriptions - List of all subscriptions
 * @returns Summary of costs for different periods
 */
export function calculateSummary(subscriptions: Subscription[]): SubscriptionSummary {
  const summary = subscriptions
    .filter(sub => !sub.disabled)
    .reduce(
      (acc, sub) => {
        // Convert to base currency (EUR)
        const baseAmount = convertToBaseCurrency(sub.price, sub.currency || 'EUR');
        const currency = (sub.currency || 'EUR') as Currency;
        
        // Add to original currency totals
        acc.originalAmounts[currency] = roundAmount(
          (acc.originalAmounts[currency] || 0) + sub.price,
          currency
        );

        // Convert everything to monthly first for consistent calculations
        const monthlyAmount = convertBetweenPeriods(baseAmount, sub.billingPeriod, 'monthly');
        
        // Update all period totals
        acc.totalMonthly += monthlyAmount;
        acc.totalWeekly += convertBetweenPeriods(monthlyAmount, 'monthly', 'weekly');
        acc.totalYearly += convertBetweenPeriods(monthlyAmount, 'monthly', 'yearly');
        acc.totalQuarterly += convertBetweenPeriods(monthlyAmount, 'monthly', 'quarterly');
        acc.grandTotalMonthly += monthlyAmount; // This is already in EUR

        return acc;
      },
      {
        totalMonthly: 0,
        totalYearly: 0,
        totalWeekly: 0,
        totalQuarterly: 0,
        grandTotalMonthly: 0,
        originalAmounts: {
          EUR: 0,
          USD: 0,
          PLN: 0
        }
      }
    );

  // Round all amounts appropriately
  return {
    ...summary,
    totalMonthly: roundAmount(summary.totalMonthly, 'EUR'),
    totalYearly: roundAmount(summary.totalYearly, 'EUR'),
    totalWeekly: roundAmount(summary.totalWeekly, 'EUR'),
    totalQuarterly: roundAmount(summary.totalQuarterly, 'EUR'),
    grandTotalMonthly: roundAmount(summary.grandTotalMonthly, 'EUR'),
    originalAmounts: Object.fromEntries(
      Object.entries(summary.originalAmounts).map(([key, value]) => [
        key,
        roundAmount(value, key as Currency)
      ])
    ) as Record<Currency, number>
  };
}
