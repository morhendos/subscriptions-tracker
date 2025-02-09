'use client';

import { getStorageProvider } from '@/lib/storage';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function TestStorageConnection() {
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');

  const testConnection = async () => {
    const storage = getStorageProvider();
    const testKey = 'subscriptions_test-user';

    try {
      setStatus('Testing connection...');
      setError('');

      // Test write
      await storage.set(testKey, [{
        name: 'Test Subscription',
        price: 9.99,
        currency: 'USD',
        billingPeriod: 'MONTHLY',
        startDate: new Date().toISOString(),
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Test subscription',
        disabled: false
      }]);

      // Test read
      const data = await storage.get(testKey);
      console.log('Retrieved data:', data);

      // Test delete
      await storage.remove(testKey);

      setStatus('✅ Connection test successful!');
    } catch (err) {
      console.error('Connection test failed:', err);
      setError(`❌ Test failed: ${err.message}`);
      setStatus('');
    }
  };

  return (
    <div className="p-4 space-y-4">
      <Button onClick={testConnection}>
        Test MongoDB Connection
      </Button>
      
      {status && (
        <div className="text-sm text-green-500">
          {status}
        </div>
      )}
      
      {error && (
        <div className="text-sm text-red-500">
          {error}
        </div>
      )}
    </div>
  );
}
