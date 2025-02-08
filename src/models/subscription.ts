import mongoose from 'mongoose';
import { Currency, BillingPeriod } from '@/types/subscriptions';

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true // For faster user-based queries
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    enum: ['USD', 'EUR', 'GBP', 'PLN'] as Currency[]
  },
  billingPeriod: {
    type: String,
    required: true,
    enum: ['MONTHLY', 'YEARLY'] as BillingPeriod[]
  },
  startDate: {
    type: Date,
    required: true
  },
  nextBillingDate: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  // Add optimistic concurrency control
  optimisticConcurrency: true,
  // Add validation for all properties
  validateBeforeSave: true
});

// Add compound index for common queries
subscriptionSchema.index({ userId: 1, nextBillingDate: 1 });
subscriptionSchema.index({ userId: 1, disabled: 1 });

// Add method to convert MongoDB document to our app's Subscription type
subscriptionSchema.methods.toSubscription = function() {
  return {
    id: this._id.toString(),
    name: this.name,
    price: this.price,
    currency: this.currency,
    billingPeriod: this.billingPeriod,
    startDate: this.startDate.toISOString(),
    nextBillingDate: this.nextBillingDate.toISOString(),
    description: this.description,
    disabled: this.disabled,
    createdAt: this.createdAt.toISOString(),
    updatedAt: this.updatedAt.toISOString()
  };
};

// Add static method for batch operations
subscriptionSchema.statics.toggleAllForUser = async function(userId: string, disabled: boolean) {
  return this.updateMany(
    { userId },
    { $set: { disabled } },
    { new: true }
  );
};

// Add pre-save hook for data validation
subscriptionSchema.pre('save', function(next) {
  if (this.nextBillingDate < this.startDate) {
    next(new Error('Next billing date cannot be before start date'));
  }
  next();
});

// Export the model
export const SubscriptionModel = mongoose.models.Subscription ||
  mongoose.model('Subscription', subscriptionSchema);

// Export types for the model
export type SubscriptionDocument = mongoose.Document & {
  userId: string;
  name: string;
  price: number;
  currency: Currency;
  billingPeriod: BillingPeriod;
  startDate: Date;
  nextBillingDate: Date;
  description?: string;
  disabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  toSubscription: () => import('@/types/subscriptions').Subscription;
};
