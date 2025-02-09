import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionModel } from '@/models/subscription';
import clientPromise from '@/lib/db';
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

  console.log('API: Starting GET request for key:', key);

  if (!key) {
    console.log('API: Missing key parameter');
    return NextResponse.json({ error: 'Key is required' }, { status: 400 });
  }

  const userId = extractUserId(key);
  if (!userId) {
    console.log('API: Invalid key format or missing userId');
    return NextResponse.json({ error: 'Invalid key format' }, { status: 400 });
  }

  try {
    console.log('API: Attempting MongoDB connection...');
    await clientPromise;
    console.log('API: MongoDB connected successfully');

    console.log('API: Fetching subscriptions for userId:', userId);
    const subscriptions = await SubscriptionModel.find({ userId })
      .sort({ nextBillingDate: 1 })
      .lean();

    console.log('API: Found subscriptions:', subscriptions);

    const result = subscriptions.map(sub => ({
      id: sub._id.toString(),
      name: sub.name,
      price: sub.price,
      currency: sub.currency,
      billingPeriod: sub.billingPeriod,
      startDate: sub.startDate.toISOString(),
      nextBillingDate: sub.nextBillingDate.toISOString(),
      description: sub.description,
      disabled: sub.disabled,
      createdAt: sub.createdAt.toISOString(),
      updatedAt: sub.updatedAt.toISOString()
    }));

    console.log('API: Returning processed subscriptions:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('API Storage GET error:', error);
    
    let errorMessage = 'Failed to read data';
    if (error instanceof mongoose.Error.MongooseError) {
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
    console.log('API: Starting POST request');
    const { key, value } = await request.json();
    
    if (!key) {
      console.log('API: Missing key in POST request');
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    const userId = extractUserId(key);
    if (!userId) {
      console.log('API: Invalid key format or missing userId');
      return NextResponse.json({ error: 'Invalid key format' }, { status: 400 });
    }

    console.log('API: Attempting MongoDB connection...');
    await clientPromise;
    console.log('API: MongoDB connected successfully');

    const subscriptions = value;
    console.log('API: Processing subscriptions for userId:', userId, subscriptions);

    // Delete existing subscriptions
    await SubscriptionModel.deleteMany({ userId });
    console.log('API: Deleted existing subscriptions');

    // Insert new subscriptions if any
    if (subscriptions && subscriptions.length > 0) {
      const docs = subscriptions.map((sub: any) => ({
        userId,
        name: sub.name,
        price: sub.price,
        currency: sub.currency,
        billingPeriod: sub.billingPeriod,
        startDate: new Date(sub.startDate),
        nextBillingDate: new Date(sub.nextBillingDate),
        description: sub.description,
        disabled: sub.disabled
      }));

      const result = await SubscriptionModel.insertMany(docs);
      console.log('API: Inserted new subscriptions:', result);

      // Return the newly inserted subscriptions with their IDs
      const insertedSubscriptions = result.map(sub => ({
        id: sub._id.toString(),
        name: sub.name,
        price: sub.price,
        currency: sub.currency,
        billingPeriod: sub.billingPeriod,
        startDate: sub.startDate.toISOString(),
        nextBillingDate: sub.nextBillingDate.toISOString(),
        description: sub.description,
        disabled: sub.disabled,
        createdAt: sub.createdAt.toISOString(),
        updatedAt: sub.updatedAt.toISOString()
      }));

      return NextResponse.json({ success: true, subscriptions: insertedSubscriptions });
    }

    console.log('API: Successfully updated subscriptions');
    return NextResponse.json({ success: true, subscriptions: [] });
  } catch (error) {
    console.error('API Storage POST error:', error);
    let errorMessage = 'Failed to write data';
    if (error instanceof mongoose.Error.MongooseError) {
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

  console.log('API: Starting DELETE request for key:', key);

  if (!key) {
    console.log('API: Missing key in DELETE request');
    return NextResponse.json({ error: 'Key is required' }, { status: 400 });
  }

  const userId = extractUserId(key);
  if (!userId) {
    console.log('API: Invalid key format or missing userId');
    return NextResponse.json({ error: 'Invalid key format' }, { status: 400 });
  }

  try {
    console.log('API: Attempting MongoDB connection...');
    await clientPromise;
    console.log('API: MongoDB connected successfully');

    await SubscriptionModel.deleteMany({ userId });
    console.log('API: Successfully deleted subscriptions for userId:', userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Storage DELETE error:', error);
    let errorMessage = 'Failed to delete data';
    if (error instanceof mongoose.Error.MongooseError) {
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