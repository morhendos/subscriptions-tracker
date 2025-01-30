import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { subscriptionSchema } from '@/lib/validations/subscription';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id: params.id },
    });

    if (!subscription || subscription.userId !== session.user.id) {
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

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id: params.id },
    });

    if (!subscription || subscription.userId !== session.user.id) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const json = await req.json();
    const body = subscriptionSchema.parse(json);

    const updatedSubscription = await prisma.subscription.update({
      where: { id: params.id },
      data: body,
    });

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

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id: params.id },
    });

    if (!subscription || subscription.userId !== session.user.id) {
      return new NextResponse('Not Found', { status: 404 });
    }

    await prisma.subscription.delete({
      where: { id: params.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE /api/subscriptions/[id] error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
