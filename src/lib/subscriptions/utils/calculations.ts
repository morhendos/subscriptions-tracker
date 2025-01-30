import { Subscription, SubscriptionSummary, Currency } from '@/types/subscriptions';
import { convertToBaseCurrency, convertCurrency } from './currency';
import { convertBetweenPeriods } from './periods';
import { CURRENCIES, roundAmount } from '../config/currencies';

/**
 * Calculate subscription summary with total costs for different periods
 * @param subscriptions - List of all subscriptions
 * @returns Summary of costs for different periods
 */
export function calculateSummary(subscriptions: Subscription[]): SubscriptionSummary {
  const initialSummary = {
    totalMonthly: 0,
    totalYearly: 0,
    grandTotalMonthly: 0,
    originalAmounts: Object.fromEntries(
      Object.keys(CURRENCIES).map(currency => [currency, 0])
    ) as Record<Currency, number>
  };

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

        // Convert to monthly first for consistent calculations
        const monthlyAmount = convertBetweenPeriods(baseAmount, sub.billingPeriod, 'MONTHLY');
        
        // Update all period totals
        acc.totalMonthly += monthlyAmount;
        acc.totalYearly += convertBetweenPeriods(monthlyAmount, 'MONTHLY', 'YEARLY');

        // Add to the grand total (already in EUR)
        acc.grandTotalMonthly += monthlyAmount;

        return acc;
      },
      initialSummary
    );

  // Round all amounts appropriately
  return {
    ...summary,
    totalMonthly: roundAmount(summary.totalMonthly, 'EUR'),
    totalYearly: roundAmount(summary.totalYearly, 'EUR'),
    grandTotalMonthly: roundAmount(summary.grandTotalMonthly, 'EUR'),
    originalAmounts: Object.fromEntries(
      Object.entries(summary.originalAmounts).map(([key, value]) => [
        key,
        roundAmount(value, key as Currency)
      ])
    ) as Record<Currency, number>
  };
}
