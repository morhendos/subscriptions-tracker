import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Subscription } from '@/types/subscription';

interface SubscriptionSummaryProps {
  subscriptions: Subscription[];
  className?: string;
}

/**
 * A component that displays a summary of all subscriptions including total cost
 * and a visualization of spending trends
 */
export const SubscriptionSummary: React.FC<SubscriptionSummaryProps> = ({
  subscriptions,
  className = '',
}) => {
  // Calculate total monthly cost
  const totalMonthlyCost = subscriptions.reduce((sum, sub) => sum + (sub.cost || 0), 0);
  
  // Prepare data for the spending trends chart
  // Group subscriptions by billing cycle
  const spendingByPeriod = new Map<string, number>();
  subscriptions.forEach(sub => {
    const period = sub.billingCycle || 'monthly';
    spendingByPeriod.set(period, (spendingByPeriod.get(period) || 0) + (sub.cost || 0));
  });

  const chartData = Array.from(spendingByPeriod).map(([period, amount]) => ({
    period: period.charAt(0).toUpperCase() + period.slice(1),
    amount
  }));

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle>Subscription Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Total Monthly Cost</h3>
            <p className="text-3xl font-bold">
              ${totalMonthlyCost.toFixed(2)}
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Spending by Billing Cycle</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ fill: '#2563eb' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Active Subscriptions</h4>
              <p className="text-2xl font-semibold">{subscriptions.length}</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Average Cost</h4>
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