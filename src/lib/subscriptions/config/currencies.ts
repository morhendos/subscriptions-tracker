import { Currency } from '@/types/subscriptions';

export interface CurrencyConfig {
  code: Currency;
  symbol: string;
  label: string;
  exchangeRate: number; // Rate to EUR
  locale: string;
  decimalPlaces: number;
}

export const CURRENCIES: Record<Currency, CurrencyConfig> = {
  EUR: {
    code: 'EUR',
    symbol: '€',
    label: 'Euro',
    exchangeRate: 1,
    locale: 'de-DE',
    decimalPlaces: 2,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    label: 'US Dollar',
    exchangeRate: 0.92, // 1 USD = 0.92 EUR
    locale: 'en-US',
    decimalPlaces: 2,
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    label: 'British Pound',
    exchangeRate: 1.17, // 1 GBP = 1.17 EUR
    locale: 'en-GB',
    decimalPlaces: 2,
  },
} as const;

export const CURRENCY_ORDER: Currency[] = ['EUR', 'USD', 'GBP'];

// Validation functions
export function isValidCurrency(currency: string): currency is Currency {
  return currency in CURRENCIES;
}

export function getCurrencyConfig(currency: Currency): CurrencyConfig {
  return CURRENCIES[currency];
}

// Safe rounding function to handle floating point precision
export function roundAmount(amount: number, currency: Currency): number {
  const config = getCurrencyConfig(currency);
  const multiplier = Math.pow(10, config.decimalPlaces);
  return Math.round(amount * multiplier) / multiplier;
}
