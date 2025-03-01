# Subscription API Update Guide

## ✅ IMPLEMENTATION COMPLETE

The subscription API routes have been successfully updated to use the subscription service functions instead of serverStorage. This guide is kept for reference purposes only.

## Original Migration Plan (For Reference)

Below is the original plan that was used to update the subscription API routes.

### 1. Update `/api/subscriptions` Route

Replace the serverStorage calls with subscription service calls:

```typescript
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getUserSubscriptions, createSubscription } from '@/lib/services/subscription-service';
import { subscriptionSchema } from '@/lib/validations/subscription';
import { withErrorHandling, createErrorResponse } from '@/lib/db/unified-error-handler';
import { MongoDBErrorCode } from '@/lib/db/error-handler';

/**
 * GET /api/subscriptions
 */
export async function GET() {
  try {
    return await withErrorHandling(async () => {
      const session = await getServerSession();

      if (!session?.user?.id) {
        return new NextResponse(
          JSON.stringify({ 
            error: 'Authentication required',
            code: 'auth.unauthorized'
          }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Replace serverStorage.getSubscriptions with getUserSubscriptions
      const subscriptions = await getUserSubscriptions(session.user.id);
      return NextResponse.json(subscriptions);
    }, 'api/subscriptions/GET');
  } catch (error: unknown) {
    console.error('GET /api/subscriptions error:', error);
    
    const errorResponse = createErrorResponse(error);
    
    return NextResponse.json(
      { error: errorResponse.error, code: errorResponse.code },
      { 
        status: (errorResponse.code === MongoDBErrorCode.CONNECTION_FAILED || 
                errorResponse.code === MongoDBErrorCode.CONNECTION_TIMEOUT) ? 503 : 500 
      }
    );
  }
}

/**
 * POST /api/subscriptions
 */
export async function POST(req: Request) {
  try {
    return await withErrorHandling(async () => {
      const session = await getServerSession();

      if (!session?.user?.id) {
        return new NextResponse(
          JSON.stringify({ 
            error: 'Authentication required',
            code: 'auth.unauthorized'
          }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const json = await req.json();
      
      try {
        const body = subscriptionSchema.parse(json);
        // Replace serverStorage.createSubscription with createSubscription
        const subscription = await createSubscription(session.user.id, body);
        return NextResponse.json(subscription);
      } catch (validationError) {
        return NextResponse.json(
          { 
            error: 'Invalid subscription data', 
            code: 'validation.failed',
            details: validationError
          },
          { status: 400 }
        );
      }
    }, 'api/subscriptions/POST');
  } catch (error: unknown) {
    console.error('POST /api/subscriptions error:', error);
    
    const errorResponse = createErrorResponse(error);
    
    return NextResponse.json(
      { error: errorResponse.error, code: errorResponse.code },
      { 
        status: (errorResponse.code === MongoDBErrorCode.CONNECTION_FAILED || 
                errorResponse.code === MongoDBErrorCode.CONNECTION_TIMEOUT) ? 503 : 500 
      }
    );
  }
}
```

### 2. Update `/api/subscriptions/[id]` Route

Replace the serverStorage calls with subscription service calls:

```typescript
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { 
  getSubscriptionById, 
  updateSubscription, 
  deleteSubscription 
} from '@/lib/services/subscription-service';
import { subscriptionSchema } from '@/lib/validations/subscription';
import { withErrorHandling, createErrorResponse } from '@/lib/db/unified-error-handler';
import { MongoDBErrorCode } from '@/lib/db/error-handler';

/**
 * GET /api/subscriptions/[id]
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    return await withErrorHandling(async () => {
      const session = await getServerSession();

      if (!session?.user?.id) {
        return new NextResponse(
          JSON.stringify({ 
            error: 'Authentication required',
            code: 'auth.unauthorized'
          }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Replace serverStorage.getSubscriptions with getSubscriptionById
      const subscription = await getSubscriptionById(session.user.id, params.id);

      if (!subscription) {
        return new NextResponse(
          JSON.stringify({ 
            error: 'Subscription not found',
            code: 'resource.not_found'
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return NextResponse.json(subscription);
    }, `api/subscriptions/${params.id}/GET`);
  } catch (error: unknown) {
    console.error(`GET /api/subscriptions/${params.id} error:`, error);
    
    const errorResponse = createErrorResponse(error);
    
    return NextResponse.json(
      { error: errorResponse.error, code: errorResponse.code },
      { 
        status: (errorResponse.code === MongoDBErrorCode.CONNECTION_FAILED || 
                errorResponse.code === MongoDBErrorCode.CONNECTION_TIMEOUT) ? 503 : 500 
      }
    );
  }
}

/**
 * PUT /api/subscriptions/[id]
 */
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    return await withErrorHandling(async () => {
      const session = await getServerSession();

      if (!session?.user?.id) {
        return new NextResponse(
          JSON.stringify({ 
            error: 'Authentication required',
            code: 'auth.unauthorized'
          }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      try {
        const json = await req.json();
        const body = subscriptionSchema.parse(json);
        
        // Replace serverStorage.updateSubscription with updateSubscription
        const updatedSubscription = await updateSubscription(
          session.user.id,
          params.id,
          body
        );

        if (!updatedSubscription) {
          return new NextResponse(
            JSON.stringify({ 
              error: 'Subscription not found',
              code: 'resource.not_found'
            }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          );
        }

        return NextResponse.json(updatedSubscription);
      } catch (validationError) {
        return NextResponse.json(
          { 
            error: 'Invalid subscription data', 
            code: 'validation.failed',
            details: validationError
          },
          { status: 400 }
        );
      }
    }, `api/subscriptions/${params.id}/PUT`);
  } catch (error: unknown) {
    console.error(`PUT /api/subscriptions/${params.id} error:`, error);
    
    const errorResponse = createErrorResponse(error);
    
    return NextResponse.json(
      { error: errorResponse.error, code: errorResponse.code },
      { 
        status: (errorResponse.code === MongoDBErrorCode.CONNECTION_FAILED || 
                errorResponse.code === MongoDBErrorCode.CONNECTION_TIMEOUT) ? 503 : 500 
      }
    );
  }
}

/**
 * DELETE /api/subscriptions/[id]
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    return await withErrorHandling(async () => {
      const session = await getServerSession();

      if (!session?.user?.id) {
        return new NextResponse(
          JSON.stringify({ 
            error: 'Authentication required',
            code: 'auth.unauthorized'
          }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Replace serverStorage.deleteSubscription with deleteSubscription
      const success = await deleteSubscription(session.user.id, params.id);

      if (!success) {
        return new NextResponse(
          JSON.stringify({ 
            error: 'Subscription not found',
            code: 'resource.not_found'
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new NextResponse(null, { status: 204 });
    }, `api/subscriptions/${params.id}/DELETE`);
  } catch (error: unknown) {
    console.error(`DELETE /api/subscriptions/${params.id} error:`, error);
    
    const errorResponse = createErrorResponse(error);
    
    return NextResponse.json(
      { error: errorResponse.error, code: errorResponse.code },
      { 
        status: (errorResponse.code === MongoDBErrorCode.CONNECTION_FAILED || 
                errorResponse.code === MongoDBErrorCode.CONNECTION_TIMEOUT) ? 503 : 500 
      }
    );
  }
}
```

## All Services Implemented ✅

- ✅ Storage Service
- ✅ Health Service 
- ✅ Auth Debug Service
- ✅ Subscription API Routes Using Subscription Service
