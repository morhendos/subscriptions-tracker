import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { subscriptionSchema } from '@/lib/validations/subscription';

export async function GET() {
  const session = await getServerSession();

  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const subscriptions = await prisma.subscription.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      nextBilling: 'asc',
    },
  });

  return NextResponse.json(subscriptions);
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const json = await req.json();
    const body = subscriptionSchema.parse(json);

    const subscription = await prisma.subscription.create({
      data: {
        ...body,
        userId: session.user.id,
      },
    });

    return NextResponse.json(subscription);
  } catch (error) {
    console.error('POST /api/subscriptions error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
