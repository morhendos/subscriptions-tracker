import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { serverStorage } from '@/lib/storage/server';
import { subscriptionSchema } from '@/lib/validations/subscription';

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const subscriptions = await serverStorage.getSubscriptions(session.user.id);
    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error('GET /api/subscriptions error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const json = await req.json();
    const body = subscriptionSchema.parse(json);

    const subscription = await serverStorage.createSubscription(session.user.id, body);
    return NextResponse.json(subscription);
  } catch (error) {
    console.error('POST /api/subscriptions error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
