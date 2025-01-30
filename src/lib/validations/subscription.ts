import { z } from 'zod';

export const subscriptionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z.number().min(0, 'Price must be a positive number'),
  currency: z.string().default('USD'),
  billingCycle: z.enum(['MONTHLY', 'YEARLY']).default('MONTHLY'),
  startDate: z.date(),
  nextBilling: z.date(),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'CANCELLED']).default('ACTIVE'),
});
