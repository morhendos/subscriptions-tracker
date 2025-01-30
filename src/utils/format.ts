import { Currency } from '@/types/subscriptions';
import { CURRENCIES } from '@/lib/subscriptions/config/currencies';

export function formatCurrency(amount: number | null | undefined, currency: Currency | null | undefined): string {
  // Default to EUR if no currency provided
  const currencyCode = currency || 'EUR';
  const config = CURRENCIES[currencyCode];
  
  // Default to 0 if no amount provided
  const value = typeof amount === 'number' ? amount : 0;

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: config.decimalPlaces,
    maximumFractionDigits: config.decimalPlaces
  }).format(value);
}

export function formatDate(dateStr: string) {
  try {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

export function convertToEur(amount: number, fromCurrency: Currency): number {
  if (fromCurrency === 'EUR') return amount;
  const rate = CURRENCIES[fromCurrency].exchangeRate;
  return amount * rate;
}

export function convertFromEur(amount: number, toCurrency: Currency): number {
  if (toCurrency === 'EUR') return amount;
  const rate = CURRENCIES[toCurrency].exchangeRate;
  return amount / rate;
}