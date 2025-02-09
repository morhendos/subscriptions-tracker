import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionModel } from '@/models/subscription';
import clientPromise from '@/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const key = searchParams.get('key');

  if (!key) {
    return NextResponse.json({ error: 'Key is required' }, { status: 400 });
  }

  try {
    // Wait for MongoDB connection
    await clientPromise;
    console.log('MongoDB connected, processing request for key:', key);

    const userId = key.split('_')[1];
    if (!userId) {
      return NextResponse.json({ error: 'Invalid key format' }, { status: 400 });
    }

    console.log('Looking for subscriptions for userId:', userId);
    const subscriptions = await SubscriptionModel.find({ userId })
      .sort({ nextBillingDate: 1 })
      .lean();

    console.log('Found subscriptions:', subscriptions);

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

    return NextResponse.json(result);
  } catch (error) {
    console.error('Storage GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// ... rest of the file remains the same
