import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { subscriptionSchema } from '@/lib/validations/subscription';
import { createErrorResponse } from '@/lib/db/unified-error-handler';
import { MongoDBErrorCode } from '@/lib/db/error-handler';
import { 
  getSubscriptionById,
  updateSubscription,
  deleteSubscription
} from '@/lib/services/subscription-service';

/**
 * GET /api/subscriptions/[id]
 * 
 * Retrieves a specific subscription by ID for the authenticated user
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    // Use service function to get specific subscription
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
 * PUT /api/subscriptions/[id]
 * 
 * Updates a specific subscription by ID for the authenticated user
 */
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    // Handle validation separately to return 400 status
    try {
      const json = await req.json();
      const validatedData = subscriptionSchema.parse(json);
      
      // Use service function to update subscription
      const updatedSubscription = await updateSubscription(
        session.user.id,
        params.id,
        validatedData
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
    console.error(`PUT /api/subscriptions/${params.id} error:`, error);
    
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
 * DELETE /api/subscriptions/[id]
 * 
 * Deletes a specific subscription by ID for the authenticated user
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    // Use service function to delete subscription
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
