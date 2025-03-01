import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getUserSubscriptions, createSubscription } from '@/lib/services/subscription-service';
import { subscriptionSchema } from '@/lib/validations/subscription';
import { withErrorHandling, createErrorResponse } from '@/lib/db/unified-error-handler';
import { MongoDBErrorCode } from '@/lib/db/error-handler';

/**
 * GET /api/subscriptions
 * 
 * Retrieves all subscriptions for the authenticated user
 */
export async function GET() {
  try {
    // Wrap the entire operation in our error handling wrapper
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

      // Use subscription service instead of serverStorage
      const subscriptions = await getUserSubscriptions(session.user.id);
      return NextResponse.json(subscriptions);
    }, 'api/subscriptions/GET');
  } catch (error: unknown) {
    console.error('GET /api/subscriptions error:', error);
    
    // Use our standardized error response
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
    // Wrap the entire operation in our error handling wrapper
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
      
      // Use try/catch for validation specifically to return 400 status
      try {
        const body = subscriptionSchema.parse(json);
        // Use subscription service instead of serverStorage
        const subscription = await createSubscription(session.user.id, body);
        return NextResponse.json(subscription);
      } catch (validationError) {
        // Handle validation errors specifically
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
    
    // Use our standardized error response
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
