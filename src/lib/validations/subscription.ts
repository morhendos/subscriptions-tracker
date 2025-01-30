import { z } from 'zod';
import { Currency, BillingPeriod, SubscriptionStatus } from '@/types/subscriptions';

export const subscriptionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z.number().min(0, 'Price must be a positive number'),
  currency: z.enum(['USD', 'EUR', 'GBP'] as const),
  billingPeriod: z.enum(['MONTHLY', 'YEARLY'] as const),
  startDate: z.string(),
  description: z.string().optional(),
});

export type SubscriptionSchemaType = z.infer<typeof subscriptionSchema>;
