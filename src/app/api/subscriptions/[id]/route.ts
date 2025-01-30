import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { serverStorage } from '@/lib/storage/server';
import { subscriptionSchema } from '@/lib/validations/subscription';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const subscriptions = await serverStorage.getSubscriptions(session.user.id);
    const subscription = subscriptions.find(s => s.id === params.id);

    if (!subscription) {
      return new NextResponse('Not Found', { status: 404 });
    }

    return NextResponse.json(subscription);
  } catch (error) {
    console.error('GET /api/subscriptions/[id] error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const json = await req.json();
    const body = subscriptionSchema.parse(json);

    const updatedSubscription = await serverStorage.updateSubscription(
      session.user.id,
      params.id,
      body
    );

    if (!updatedSubscription) {
      return new NextResponse('Not Found', { status: 404 });
    }

    return NextResponse.json(updatedSubscription);
  } catch (error) {
    console.error('PUT /api/subscriptions/[id] error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const success = await serverStorage.deleteSubscription(session.user.id, params.id);

    if (!success) {
      return new NextResponse('Not Found', { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE /api/subscriptions/[id] error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
