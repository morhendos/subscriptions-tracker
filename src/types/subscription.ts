export type Subscription = {
  id: string;
  name: string;
  price: number;
  currency: string;
  billingCycle: 'MONTHLY' | 'YEARLY';
  startDate: Date;
  nextBilling: Date;
  description?: string;
  userId: string;
  status: 'ACTIVE' | 'CANCELLED';
  createdAt: Date;
  updatedAt: Date;
};
