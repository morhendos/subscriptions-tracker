# Simple Implementation Plan

This document outlines the minimal steps needed to update the API routes to use service functions.

## Step 1: Identify API Routes to Update

These are the API routes that need to be updated:

1. `/api/subscriptions` (GET, POST)
2. `/api/subscriptions/[id]` (GET, PUT, DELETE)
3. `/api/storage` (GET, POST, DELETE)

## Step 2: Use Existing Service Functions

The subscription service is already implemented and can be used immediately:
- `getUserSubscriptions` for GET /api/subscriptions
- `getSubscriptionById` for GET /api/subscriptions/[id]
- `createSubscription` for POST /api/subscriptions
- `updateSubscription` for PUT /api/subscriptions/[id]
- `deleteSubscription` for DELETE /api/subscriptions/[id]

## Step 3: Update API Routes

### 3.1 Update `/api/subscriptions` Route

```typescript
// src/app/api/subscriptions/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createErrorResponse } from '@/lib/db/unified-error-handler';
import { MongoDBErrorCode } from '@/lib/db/error-handler';

// Import the service functions
import { getUserSubscriptions, createSubscription } from '@/lib/services/subscription-service';
import { subscriptionSchema } from '@/lib/validations/subscription';

export async function GET() {
  try {
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

    // Use the service function
    const subscriptions = await getUserSubscriptions(session.user.id);
    return NextResponse.json(subscriptions);
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

export async function POST(req: Request) {
  try {
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
      const validatedData = subscriptionSchema.parse(json);
      
      // Use the service function
      const subscription = await createSubscription(session.user.id, validatedData);
      return NextResponse.json(subscription);
    } catch (validationError) {
      // Handle validation errors
      return NextResponse.json(
        { 
          error: 'Invalid subscription data', 
          code: 'validation.failed',
          details: validationError
        },
        { status: 400 }
      );
    }
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

### 3.2 Update `/api/subscriptions/[id]` Route

```typescript
// src/app/api/subscriptions/[id]/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createErrorResponse } from '@/lib/db/unified-error-handler';
import { MongoDBErrorCode } from '@/lib/db/error-handler';

// Import the service functions
import { 
  getSubscriptionById,
  updateSubscription,
  deleteSubscription 
} from '@/lib/services/subscription-service';
import { subscriptionSchema } from '@/lib/validations/subscription';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
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

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
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

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
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

### 3.3 Storage API (Optional for now)

For the storage API, you can either keep using the current implementation or update it later after confirming the subscription API routes work correctly.

## Step 4: Test the Changes

After updating each route:
1. Start the application
2. Login to the app
3. Verify that subscriptions load correctly
4. Try creating and editing subscriptions
5. Try deleting subscriptions

## That's It!

These updates will integrate the service functions with your API routes. No unit tests or additional documentation needed at this stage.
