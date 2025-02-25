import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionModel, SubscriptionDocument } from '@/models/subscription';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Subscription } from '@/types/subscriptions';
import mongoose from 'mongoose';

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
    await connectToDatabase();

    const subscriptions = await SubscriptionModel.find({ userId })
      .sort({ nextBillingDate: 1 })
      .lean();

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
    console.error('Error loading subscriptions:', error);
    
    let errorMessage = 'Failed to read data';
    if (error instanceof mongoose.mongo.MongoError) {
      errorMessage = `MongoDB Error: ${error.message}`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
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

    await connectToDatabase();

    const subscriptions = value;

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
      const insertedSubscriptions = result.map((doc): Subscription => ({
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

      return NextResponse.json({ success: true, subscriptions: insertedSubscriptions });
    }

    return NextResponse.json({ success: true, subscriptions: [] });
  } catch (error) {
    console.error('Error saving subscriptions:', error);
    
    let errorMessage = 'Failed to write data';
    if (error instanceof mongoose.mongo.MongoError) {
      errorMessage = `MongoDB Error: ${error.message}`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
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
    await connectToDatabase();
    await SubscriptionModel.deleteMany({ userId });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting subscriptions:', error);
    
    let errorMessage = 'Failed to delete data';
    if (error instanceof mongoose.mongo.MongoError) {
      errorMessage = `MongoDB Error: ${error.message}`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}