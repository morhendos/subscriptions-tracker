import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import mongoose from 'mongoose';
import { SubscriptionModel } from '../subscription';

async function testSubscriptionModel() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB');

    // Test data
    const testSubscription = {
      userId: 'test-user-1',
      name: 'Netflix',
      price: 14.99,
      currency: 'USD',
      billingPeriod: 'MONTHLY',
      startDate: new Date(),
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      description: 'Streaming service'
    };

    // Test creation
    console.log('Testing subscription creation...');
    const subscription = new SubscriptionModel(testSubscription);
    await subscription.save();
    console.log('✅ Subscription created successfully');

    // Test reading
    console.log('Testing subscription retrieval...');
    const found = await SubscriptionModel.findById(subscription._id);
    console.log('✅ Subscription retrieved successfully:', found?.toSubscription());

    // Test updating
    console.log('Testing subscription update...');
    await SubscriptionModel.findByIdAndUpdate(
      subscription._id,
      { price: 15.99 },
      { new: true }
    );
    console.log('✅ Subscription updated successfully');

    // Test batch operations
    console.log('Testing batch operations...');
    await SubscriptionModel.toggleAllForUser('test-user-1', true);
    console.log('✅ Batch operation successful');

    // Test deletion
    console.log('Testing subscription deletion...');
    await SubscriptionModel.findByIdAndDelete(subscription._id);
    console.log('✅ Subscription deleted successfully');

    // Test validation
    console.log('Testing validation...');
    const invalidSubscription = new SubscriptionModel({
      ...testSubscription,
      nextBillingDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // yesterday
    });

    try {
      await invalidSubscription.save();
    } catch (error) {
      console.log('✅ Validation working as expected:', error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testSubscriptionModel();
