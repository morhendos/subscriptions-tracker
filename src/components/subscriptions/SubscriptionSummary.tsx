import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Subscription } from '@/types/subscription';

interface SubscriptionSummaryProps {
  subscriptions: Subscription[];
  className?: string;
}

/**
 * A component that displays a summary of all subscriptions including total cost
 * and visualization of spending distribution
 */
export const SubscriptionSummary: React.FC<SubscriptionSummaryProps> = ({
  subscriptions,
  className = '',
}) => {
  // Calculate total monthly cost
  const totalMonthlyCost = subscriptions.reduce((sum, sub) => {
    const monthlyPrice = sub.billingCycle === 'YEARLY' ? sub.price / 12 : sub.price;
    return sum + monthlyPrice;
  }, 0);
  
  // Group subscriptions by billing cycle
  const spendingByPeriod = new Map<Subscription['billingCycle'], number>();
  subscriptions.forEach(sub => {
    const currentAmount = spendingByPeriod.get(sub.billingCycle) || 0;
    spendingByPeriod.set(sub.billingCycle, currentAmount + sub.price);
  });

  // Find the highest spending for scaling the bars
  const maxSpending = Math.max(...Array.from(spendingByPeriod.values()), 0);

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle>Subscription Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-medium">Total Monthly Cost</h3>
            <p className="text-3xl font-bold">
              ${totalMonthlyCost.toFixed(2)}
            </p>
          </div>
          
          {spendingByPeriod.size > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-4">Spending by Billing Cycle</h3>
              <div className="space-y-3">
                {Array.from(spendingByPeriod).map(([period, amount]) => (
                  <div key={period} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{period.toLowerCase()}</span>
                      <span>${amount.toFixed(2)}</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ 
                          width: `${(amount / maxSpending) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Active Subscriptions</h4>
              <p className="text-2xl font-semibold">
                {subscriptions.filter(sub => sub.status === 'ACTIVE').length}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Average Monthly Cost</h4>
              <p className="text-2xl font-semibold">
                ${subscriptions.length ? (totalMonthlyCost / subscriptions.length).toFixed(2) : '0.00'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionSummary;