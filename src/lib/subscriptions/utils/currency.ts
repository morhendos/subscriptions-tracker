import { Currency } from '@/types/subscriptions';
import { getCurrencyConfig, roundAmount } from '../config/currencies';

/**
 * Convert an amount from one currency to another
 * @param amount - Amount to convert
 * @param fromCurrency - Source currency
 * @param toCurrency - Target currency
 * @returns Converted amount
 */
export function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): number {
  if (fromCurrency === toCurrency) return amount;

  const fromConfig = getCurrencyConfig(fromCurrency);
  const toConfig = getCurrencyConfig(toCurrency);

  // First convert to EUR (base currency)
  const amountInEur = amount * fromConfig.exchangeRate;
  
  // Then convert to target currency
  const convertedAmount = amountInEur / toConfig.exchangeRate;
  
  // Round according to target currency's decimal places
  return roundAmount(convertedAmount, toCurrency);
}

/**
 * Convert an amount to the base currency (EUR)
 * @param amount - Amount to convert
 * @param fromCurrency - Source currency
 * @returns Amount in EUR
 */
export function convertToBaseCurrency(amount: number, fromCurrency: Currency): number {
  return convertCurrency(amount, fromCurrency, 'EUR');
}

/**
 * Format an amount according to currency's locale and rules
 * @param amount - Amount to format
 * @param currency - Currency to format as
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: Currency): string {
  const config = getCurrencyConfig(currency);
  
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: config.decimalPlaces,
    maximumFractionDigits: config.decimalPlaces
  }).format(amount);
}
