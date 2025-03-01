# Refactored API Example

This document provides an example of how to refactor the API routes to use the service functions.

## Original API Route

```typescript
// Original implementation
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

      const subscriptions = await serverStorage.getSubscriptions(session.user.id);
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
```

## Refactored API Route Using Service Functions

```typescript
// src/app/api/subscriptions/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createErrorResponse } from '@/lib/db/unified-error-handler';
import { MongoDBErrorCode } from '@/lib/db/error-handler';
import { getUserSubscriptions, createSubscription } from '@/lib/services/subscription-service';
import { subscriptionSchema } from '@/lib/validations/subscription';

/**
 * GET /api/subscriptions
 * 
 * Retrieves all subscriptions for the authenticated user
 */
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

/**
 * POST /api/subscriptions
 * 
 * Creates a new subscription for the authenticated user
 */
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
    
    // Validate input data
    try {
      const validatedData = subscriptionSchema.parse(json);
      
      // Use the service function
      const subscription = await createSubscription(session.user.id, validatedData);
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

## Main Differences

1. **Focused Responsibility**: The API route only handles HTTP concerns, auth checking, and error responses
2. **Business Logic in Services**: All database operations are now in the service layer
3. **Simplified Error Handling**: Error handling remains in the API layer, but business logic is abstracted away
4. **Improved Testability**: The service functions can be mocked for API route testing

## Refactoring Steps

When refactoring existing API routes:

1. Identify database/business logic in the API route
2. Move this logic to service functions
3. Replace the direct database calls with service function calls
4. Keep validation and auth checks in the API layer
5. Keep the error handling structure intact

## Benefits of This Approach

- **Maintainability**: API routes are cleaner and easier to understand
- **Reusability**: Service functions can be used across different API routes
- **Testability**: Services can be tested independently from API routes
- **Consistency**: All database operations follow the same pattern

## Migration Strategy

Refactor one API route at a time:

1. Start with simpler endpoints (GET requests)
2. Move to more complex endpoints (POST, PUT, DELETE)
3. Run tests after each refactoring to ensure everything works
4. Update documentation as you go
