# Complete API Update Plan

This document outlines how to update all API routes in our application to use service functions.

## Why Use Service Functions in API Routes?

Even in a small application, using service functions with API routes provides several practical benefits:

1. **Cleaner API Routes**: API routes focus only on HTTP concerns (request/response handling), making them easier to understand.

2. **Code Reuse**: The same business logic can be used from multiple routes or client components without duplication.

3. **Easier Maintenance**: When database schemas change, you only need to update the service functions, not every API route.

4. **Better Error Handling**: Centralized error handling in services ensures consistent responses across all routes.

5. **Simpler Testing**: You can verify business logic works without dealing with HTTP complexities.

## All API Routes to Update

### Core API Routes

1. `/api/subscriptions` (GET, POST)
2. `/api/subscriptions/[id]` (GET, PUT, DELETE)
3. `/api/storage` (GET, POST, DELETE)
4. `/api/health/db` (GET)

### Utility Routes (if time permits)

5. `/api/healthz` (GET)
6. `/api/check-environment` (GET)

## 1. Update Subscription Routes

### Update `/api/subscriptions` Route

```typescript
// src/app/api/subscriptions/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createErrorResponse } from '@/lib/db/unified-error-handler';
import { MongoDBErrorCode } from '@/lib/db/error-handler';
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

### Update `/api/subscriptions/[id]` Route

```typescript
// src/app/api/subscriptions/[id]/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createErrorResponse } from '@/lib/db/unified-error-handler';
import { MongoDBErrorCode } from '@/lib/db/error-handler';
import { getSubscriptionById, updateSubscription, deleteSubscription } from '@/lib/services/subscription-service';
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

## 2. Create Storage Service

We need to create a storage service to update the storage API:

```typescript
// src/lib/services/storage-service.ts

import { withConnection } from '@/lib/db/simplified-connection';
import { withErrorHandling } from '@/lib/db/unified-error-handler';
import { SubscriptionModel } from '@/models/subscription';
import { Subscription } from '@/types/subscriptions';
import mongoose from 'mongoose';

const STORAGE_KEY_PREFIX = 'subscriptions';

/**
 * Extract userId from storage key
 */
export function extractUserId(key: string): string | null {
  if (!key.startsWith(STORAGE_KEY_PREFIX + '_')) {
    return null;
  }
  return key.slice(STORAGE_KEY_PREFIX.length + 1);
}

/**
 * Format subscription for API response
 */
function formatSubscription(doc: any): Subscription {
  return {
    id: doc._id.toString(),
    name: doc.name,
    price: doc.price,
    currency: doc.currency,
    billingPeriod: doc.billingPeriod,
    startDate: doc.startDate instanceof Date ? doc.startDate.toISOString() : doc.startDate,
    nextBillingDate: doc.nextBillingDate instanceof Date ? doc.nextBillingDate.toISOString() : doc.nextBillingDate,
    description: doc.description,
    disabled: doc.disabled || false,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : doc.updatedAt
  };
}

/**
 * Get subscriptions by storage key
 */
export async function getSubscriptionsByKey(key: string): Promise<Subscription[]> {
  return withErrorHandling(async () => {
    const userId = extractUserId(key);
    if (!userId) {
      return [];
    }

    return withConnection(async () => {
      const subscriptions = await SubscriptionModel.find({ userId })
        .sort({ nextBillingDate: 1 })
        .lean()
        .exec();
      
      return subscriptions.map(formatSubscription);
    });
  }, 'getSubscriptionsByKey');
}

/**
 * Save subscriptions by storage key
 */
export async function saveSubscriptionsByKey(
  key: string, 
  subscriptionsData: any[]
): Promise<Subscription[]> {
  return withErrorHandling(async () => {
    const userId = extractUserId(key);
    if (!userId) {
      throw new Error('Invalid key format');
    }

    return withConnection(async () => {
      // Delete existing subscriptions
      await SubscriptionModel.deleteMany({ userId });

      // Insert new subscriptions if any
      if (subscriptionsData && subscriptionsData.length > 0) {
        const docs = subscriptionsData.map((sub: any) => ({
          userId,
          name: sub.name,
          price: sub.price,
          currency: sub.currency,
          billingPeriod: sub.billingPeriod,
          startDate: sub.startDate ? new Date(sub.startDate) : new Date(),
          nextBillingDate: sub.nextBillingDate ? new Date(sub.nextBillingDate) : new Date(),
          description: sub.description,
          disabled: sub.disabled ?? false
        }));

        const result = await SubscriptionModel.insertMany(docs);

        // Return the newly inserted subscriptions with their IDs
        return result.map(formatSubscription);
      }
      
      return [];
    });
  }, 'saveSubscriptionsByKey');
}

/**
 * Delete subscriptions by storage key
 */
export async function deleteSubscriptionsByKey(key: string): Promise<boolean> {
  return withErrorHandling(async () => {
    const userId = extractUserId(key);
    if (!userId) {
      return false;
    }

    return withConnection(async () => {
      const result = await SubscriptionModel.deleteMany({ userId });
      return result.deletedCount > 0;
    });
  }, 'deleteSubscriptionsByKey');
}
```

## 3. Update Storage API Route

```typescript
// src/app/api/storage/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/db/unified-error-handler';
import { MongoDBErrorCode } from '@/lib/db/error-handler';
import { getSubscriptionsByKey, saveSubscriptionsByKey, deleteSubscriptionsByKey, extractUserId } from '@/lib/services/storage-service';

/**
 * GET /api/storage
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const key = searchParams.get('key');

  try {
    if (!key) {
      return NextResponse.json(
        { error: 'Key is required', code: 'validation.required_field' }, 
        { status: 400 }
      );
    }

    const userId = extractUserId(key);
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid key format', code: 'validation.invalid_input' }, 
        { status: 400 }
      );
    }

    const subscriptions = await getSubscriptionsByKey(key);
    return NextResponse.json(subscriptions);
  } catch (error: unknown) {
    console.error('Storage API GET error:', error);
    
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
 * POST /api/storage
 */
export async function POST(request: NextRequest) {
  try {
    const { key, value } = await request.json();
    
    if (!key) {
      return NextResponse.json(
        { error: 'Key is required', code: 'validation.required_field' }, 
        { status: 400 }
      );
    }

    const userId = extractUserId(key);
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid key format', code: 'validation.invalid_input' }, 
        { status: 400 }
      );
    }

    const subscriptions = await saveSubscriptionsByKey(key, value);
    
    return NextResponse.json({ 
      success: true, 
      subscriptions 
    });
  } catch (error: unknown) {
    console.error('Storage API POST error:', error);
    
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
 * DELETE /api/storage
 */
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const key = searchParams.get('key');

  try {
    if (!key) {
      return NextResponse.json(
        { error: 'Key is required', code: 'validation.required_field' }, 
        { status: 400 }
      );
    }

    const userId = extractUserId(key);
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid key format', code: 'validation.invalid_input' }, 
        { status: 400 }
      );
    }

    await deleteSubscriptionsByKey(key);
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Storage API DELETE error:', error);
    
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

## 4. Create Database Health Service

```typescript
// src/lib/services/health-service.ts

import { withConnection } from '@/lib/db/simplified-connection';
import { withErrorHandling } from '@/lib/db/unified-error-handler';
import mongoose from 'mongoose';

/**
 * Check database connection health
 */
export async function checkDatabaseHealth(): Promise<{
  status: string;
  details?: Record<string, any>;
}> {
  return withErrorHandling(async () => {
    return withConnection(async (db) => {
      // Check if the connection is ready
      const isConnected = db.connection.readyState === 1;
      
      if (!isConnected) {
        return {
          status: 'error',
          details: {
            message: 'Database connection not ready',
            readyState: db.connection.readyState
          }
        };
      }
      
      // Run a simple command to check the database
      const adminDb = db.connection.db.admin();
      const serverInfo = await adminDb.serverInfo();
      
      return {
        status: 'ok',
        details: {
          version: serverInfo.version,
          uptime: serverInfo.uptime,
          connection: {
            host: db.connection.host,
            port: db.connection.port,
            name: db.connection.name
          }
        }
      };
    });
  }, 'checkDatabaseHealth');
}
```

## 5. Update Health DB API Route

```typescript
// src/app/api/health/db/route.ts

import { NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/db/unified-error-handler';
import { MongoDBErrorCode } from '@/lib/db/error-handler';
import { checkDatabaseHealth } from '@/lib/services/health-service';

export async function GET() {
  try {
    const healthStatus = await checkDatabaseHealth();
    
    if (healthStatus.status !== 'ok') {
      return NextResponse.json(
        { status: 'error', ...healthStatus },
        { status: 503 }
      );
    }
    
    return NextResponse.json({ status: 'ok', ...healthStatus });
  } catch (error: unknown) {
    console.error('Health DB API error:', error);
    
    const errorResponse = createErrorResponse(error);
    
    return NextResponse.json(
      { 
        status: 'error',
        error: errorResponse.error, 
        code: errorResponse.code 
      },
      { 
        status: (errorResponse.code === MongoDBErrorCode.CONNECTION_FAILED || 
                errorResponse.code === MongoDBErrorCode.CONNECTION_TIMEOUT) ? 503 : 500 
      }
    );
  }
}
```

## 6. Update Any Other Health API Routes

```typescript
// src/app/api/healthz/route.ts

import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/services/health-service';

export async function GET() {
  try {
    // Check database health
    const dbHealth = await checkDatabaseHealth();
    
    // Return simple health status
    return NextResponse.json({
      status: 'ok',
      version: process.env.APP_VERSION || '1.0.0',
      database: dbHealth.status
    });
  } catch (error) {
    console.error('Healthz API error:', error);
    
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Health check failed'
      },
      { status: 500 }
    );
  }
}
```

## 7. Basic Verification

1. Start the application
2. Log in to the app
3. Verify that subscriptions load correctly
4. Try creating and editing subscriptions
5. Try deleting subscriptions
6. Check the health endpoints

## Time to Implement

This should take about 2-3 hours to implement and verify, depending on familiarity with the codebase.
