import { Currency, EXCHANGE_RATES } from '@/types/subscriptions';

const CURRENCY_LOCALES: Record<Currency, string> = {
  EUR: 'de-DE', // German locale for Euro
  USD: 'en-US', // US locale for USD
  PLN: 'pl-PL'  // Polish locale for PLN
};

export function formatCurrency(amount: number | null | undefined, currency: Currency | null | undefined): string {
  // Default to EUR if no currency provided
  const currencyCode = currency || 'EUR';
  
  // Default to 0 if no amount provided
  const value = typeof amount === 'number' ? amount : 0;

  return new Intl.NumberFormat(CURRENCY_LOCALES[currencyCode], {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
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
  return amount * EXCHANGE_RATES[fromCurrency];
}

export function convertFromEur(amount: number, toCurrency: Currency): number {
  if (toCurrency === 'EUR') return amount;
  return amount / EXCHANGE_RATES[toCurrency];
}