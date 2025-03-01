import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { subscriptionSchema } from '@/lib/validations/subscription';
import { createErrorResponse } from '@/lib/db/unified-error-handler';
import { MongoDBErrorCode } from '@/lib/db/error-handler';
import { 
  getUserSubscriptions,
  createSubscription 
} from '@/lib/services/subscription-service';

/**
 * GET /api/subscriptions
 * 
 * Retrieves all subscriptions for the authenticated user
 */
export async function GET() {
  try {
    // Auth check
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

    // Use service function to get subscriptions
    const subscriptions = await getUserSubscriptions(session.user.id);
    return NextResponse.json(subscriptions);
  } catch (error: unknown) {
    console.error('GET /api/subscriptions error:', error);
    
    // Use standardized error response
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
    // Auth check
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
      
      // Use service function to create subscription
      const subscription = await createSubscription(session.user.id, validatedData);
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
  } catch (error: unknown) {
    console.error('POST /api/subscriptions error:', error);
    
    // Use standardized error response
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
