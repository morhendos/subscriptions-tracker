import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { MongoDBStorageProvider } from '../mongodb';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function testMongoDBProvider() {
  const provider = new MongoDBStorageProvider();
  const testUserId = 'test-user-1';
  const storageKey = `subscriptions_${testUserId}`;

  try {
    console.log('Testing MongoDB storage provider...');

    // Test data
    const testSubscriptions = [
      {
        name: 'Netflix',
        price: 14.99,
        currency: 'USD',
        billingPeriod: 'MONTHLY',
        startDate: new Date().toISOString(),
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Streaming service',
        disabled: false
      },
      {
        name: 'Spotify',
        price: 9.99,
        currency: 'USD',
        billingPeriod: 'MONTHLY',
        startDate: new Date().toISOString(),
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Music streaming',
        disabled: false
      }
    ];

    // Test set
    console.log('Testing set operation...');
    await provider.set(storageKey, testSubscriptions);
    console.log('✅ Set operation successful');

    // Test get
    console.log('Testing get operation...');
    const retrieved = await provider.get(storageKey);
    console.log('✅ Get operation successful');
    console.log('Retrieved data:', retrieved);

    // Test data integrity
    console.log('Testing data integrity...');
    if (!retrieved || !Array.isArray(retrieved)) {
      throw new Error('Retrieved data is not an array');
    }
    if (retrieved.length !== testSubscriptions.length) {
      throw new Error('Retrieved data length does not match');
    }
    console.log('✅ Data integrity verified');

    // Test remove
    console.log('Testing remove operation...');
    await provider.remove(storageKey);
    const afterRemove = await provider.get(storageKey);
    if (afterRemove && Array.isArray(afterRemove) && afterRemove.length > 0) {
      throw new Error('Data not properly removed');
    }
    console.log('✅ Remove operation successful');

    // Test clear
    console.log('Testing clear operation...');
    await provider.set(storageKey, testSubscriptions);
    await provider.clear();
    const afterClear = await provider.get(storageKey);
    if (afterClear && Array.isArray(afterClear) && afterClear.length > 0) {
      throw new Error('Data not properly cleared');
    }
    console.log('✅ Clear operation successful');

    console.log('✅ All tests passed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Clean up
    try {
      await provider.clear();
    } catch (error) {
      console.error('Clean up failed:', error);
    }
  }
}

testMongoDBProvider();
