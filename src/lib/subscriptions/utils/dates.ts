/**
 * Calculate next billing date based on start date and billing period
 * @param startDate - Initial subscription date
 * @param billingPeriod - Billing frequency (weekly, monthly, etc)
 * @returns Next billing date as ISO string
 */
export function calculateNextBillingDate(startDate: string, billingPeriod: string): string {
  const date = new Date(startDate);
  const today = new Date();
  
  if (date > today) {
    return date.toISOString();
  }

  const timeDiff = today.getTime() - date.getTime();
  let periodInMs: number;

  switch (billingPeriod) {
    case 'weekly':
      periodInMs = 7 * 24 * 60 * 60 * 1000;
      break;
    case 'monthly':
      periodInMs = 30 * 24 * 60 * 60 * 1000;
      break;
    case 'quarterly':
      periodInMs = 90 * 24 * 60 * 60 * 1000;
      break;
    case 'yearly':
      periodInMs = 365 * 24 * 60 * 60 * 1000;
      break;
    default:
      return date.toISOString();
  }

  const periodsElapsed = Math.ceil(timeDiff / periodInMs);
  const nextBillingDate = new Date(date.getTime() + (periodsElapsed * periodInMs));

  return nextBillingDate.toISOString();
}