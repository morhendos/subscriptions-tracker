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
    await clientPromise;
    const userId = key.split('_')[1];
    
    if (!userId) {
      return NextResponse.json({ error: 'Invalid key format' }, { status: 400 });
    }

    const subscriptions = await SubscriptionModel.find({ userId })
      .sort({ nextBillingDate: 1 })
      .lean();

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
      { error: 'Failed to read data' },
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

    await clientPromise;
    const userId = key.split('_')[1];
    
    if (!userId) {
      return NextResponse.json({ error: 'Invalid key format' }, { status: 400 });
    }

    const subscriptions = value;

    // Delete existing subscriptions
    await SubscriptionModel.deleteMany({ userId });

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

      await SubscriptionModel.insertMany(docs);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Storage POST error:', error);
    return NextResponse.json(
      { error: 'Failed to write data' },
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

  try {
    await clientPromise;
    const userId = key.split('_')[1];
    
    if (!userId) {
      return NextResponse.json({ error: 'Invalid key format' }, { status: 400 });
    }

    await SubscriptionModel.deleteMany({ userId });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Storage DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete data' },
      { status: 500 }
    );
  }
}
