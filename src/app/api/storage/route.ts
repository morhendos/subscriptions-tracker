import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionModel } from '@/models/subscription';
import clientPromise from '@/lib/db';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const key = searchParams.get('key');

  console.log('API: Starting GET request for key:', key);

  if (!key) {
    console.log('API: Missing key parameter');
    return NextResponse.json({ error: 'Key is required' }, { status: 400 });
  }

  try {
    console.log('API: Attempting MongoDB connection...');
    await clientPromise;
    console.log('API: MongoDB connected successfully');

    const userId = key.split('_')[1];
    if (!userId) {
      console.log('API: Invalid key format');
      return NextResponse.json({ error: 'Invalid key format' }, { status: 400 });
    }

    console.log('API: Fetching subscriptions for userId:', userId);
    const subscriptions = await SubscriptionModel.find({ userId })
      .sort({ nextBillingDate: 1 })
      .lean();

    console.log('API: Found subscriptions:', subscriptions.length);

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

    console.log('API: Successfully processed subscriptions');
    return NextResponse.json(result);
  } catch (error) {
    console.error('API Storage GET error:', error);
    
    // More detailed error message
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

// ... rest of the routes remain the same ...
