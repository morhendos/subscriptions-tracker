import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionModel } from '@/models/subscription';
import { Subscription } from '@/types/subscriptions';
import mongoose from 'mongoose';
import { withConnection, handleMongoError, logMongoError } from '@/lib/db';

const STORAGE_KEY_PREFIX = 'subscriptions';

// Helper to extract userId from storage key
function extractUserId(key: string): string | null {
  if (!key.startsWith(STORAGE_KEY_PREFIX + '_')) {
    return null;
  }
  return key.slice(STORAGE_KEY_PREFIX.length + 1);
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const key = searchParams.get('key');

  if (!key) {
    return NextResponse.json({ error: 'Key is required' }, { status: 400 });
  }

  const userId = extractUserId(key);
  if (!userId) {
    return NextResponse.json({ error: 'Invalid key format' }, { status: 400 });
  }

  try {
    // Add longer timeout for this specific operation since it can be demanding
    const subscriptions = await withConnection(async () => {
      return SubscriptionModel.find({ userId })
        .sort({ nextBillingDate: 1 })
        .lean()
        .exec(); // Add explicit exec to ensure promise completion
    }, {
      serverSelectionTimeoutMS: 15000,  // 15 seconds (increased from default)
      timeoutMS: 30000, // 30 seconds (increased from default)
    });

    // Handle case where subscriptions is undefined or null
    if (!subscriptions) {
      console.error('Storage API GET: No subscriptions returned from database');
      return NextResponse.json(
        { error: 'Failed to retrieve subscriptions data' }, 
        { status: 500 }
      );
    }

    // Make sure we handle non-array responses as an error
    if (!Array.isArray(subscriptions)) {
      console.error('Storage API GET: Unexpected response type from database', typeof subscriptions);
      return NextResponse.json(
        { error: 'Unexpected data format from database' }, 
        { status: 500 }
      );
    }

    const result = subscriptions.map((sub): Subscription => ({
      id: (sub._id as mongoose.Types.ObjectId).toString(),
      name: sub.name,
      price: sub.price,
      currency: sub.currency,
      billingPeriod: sub.billingPeriod,
      startDate: (sub.startDate as Date).toISOString(),
      nextBillingDate: (sub.nextBillingDate as Date).toISOString(),
      description: sub.description,
      disabled: sub.disabled,
      createdAt: (sub.createdAt as Date).toISOString(),
      updatedAt: (sub.updatedAt as Date).toISOString()
    }));

    return NextResponse.json(result);
  } catch (error) {
    logMongoError(error, 'Storage API GET');
    
    const mongoError = handleMongoError(error, 'Failed to read data');
    
    // Ensure we always return valid JSON even for timeout errors
    return NextResponse.json(
      { error: mongoError.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { key, value } = await request.json();
    
    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    const userId = extractUserId(key);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid key format' }, { status: 400 });
    }

    const subscriptions = value;

    const result = await withConnection(async () => {
      // Delete existing subscriptions
      await SubscriptionModel.deleteMany({ userId });

      // Insert new subscriptions if any
      if (subscriptions && subscriptions.length > 0) {
        const docs = subscriptions.map((sub: Partial<Subscription>) => ({
          userId,
          name: sub.name,
          price: sub.price,
          currency: sub.currency,
          billingPeriod: sub.billingPeriod,
          startDate: sub.startDate ? new Date(sub.startDate) : new Date(),
          nextBillingDate: sub.nextBillingDate ? new Date(sub.nextBillingDate) : new Date(),
          description: sub.description,
          disabled: sub.disabled ?? false
        }));

        const result = await SubscriptionModel.insertMany(docs);

        // Return the newly inserted subscriptions with their IDs
        return result.map((doc): Subscription => ({
          id: doc._id.toString(),
          name: doc.name,
          price: doc.price,
          currency: doc.currency,
          billingPeriod: doc.billingPeriod,
          startDate: doc.startDate.toISOString(),
          nextBillingDate: doc.nextBillingDate.toISOString(),
          description: doc.description,
          disabled: doc.disabled,
          createdAt: doc.createdAt.toISOString(),
          updatedAt: doc.updatedAt.toISOString()
        }));
      }
      
      return [];
    }, {
      serverSelectionTimeoutMS: 15000,  // 15 seconds
      timeoutMS: 30000, // 30 seconds
    });

    return NextResponse.json({ 
      success: true, 
      subscriptions: result 
    });
  } catch (error) {
    logMongoError(error, 'Storage API POST');
    
    const mongoError = handleMongoError(error, 'Failed to write data');
    return NextResponse.json(
      { error: mongoError.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const key = searchParams.get('key');

  if (!key) {
    return NextResponse.json({ error: 'Key is required' }, { status: 400 });
  }

  const userId = extractUserId(key);
  if (!userId) {
    return NextResponse.json({ error: 'Invalid key format' }, { status: 400 });
  }

  try {
    await withConnection(async () => {
      await SubscriptionModel.deleteMany({ userId });
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    logMongoError(error, 'Storage API DELETE');
    
    const mongoError = handleMongoError(error, 'Failed to delete data');
    return NextResponse.json(
      { error: mongoError.message },
      { status: 500 }
    );
  }
}