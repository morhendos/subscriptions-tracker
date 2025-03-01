import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { serverStorage } from '@/lib/storage/server';
import { subscriptionSchema } from '@/lib/validations/subscription';
import { withErrorHandling, createErrorResponse } from '@/lib/db/unified-error-handler';
import { MongoDBErrorCode } from '@/lib/db/error-handler';

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

      const subscriptions = await serverStorage.getSubscriptions(session.user.id);
      const subscription = subscriptions.find(s => s.id === params.id);

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
  } catch (error) {
    console.error(`GET /api/subscriptions/${params.id} error:`, error);
    
    // Use our standardized error response
    const errorResponse = createErrorResponse(error);
    
    return NextResponse.json(
      { error: errorResponse.error, code: errorResponse.code },
      { status: error.code === MongoDBErrorCode.SERVICE_UNAVAILABLE ? 503 : 500 }
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

      // Handle validation separately to return 400 status
      try {
        const json = await req.json();
        const body = subscriptionSchema.parse(json);
        
        const updatedSubscription = await serverStorage.updateSubscription(
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
    }, `api/subscriptions/${params.id}/PUT`);
  } catch (error) {
    console.error(`PUT /api/subscriptions/${params.id} error:`, error);
    
    // Use our standardized error response
    const errorResponse = createErrorResponse(error);
    
    return NextResponse.json(
      { error: errorResponse.error, code: errorResponse.code },
      { status: error.code === MongoDBErrorCode.SERVICE_UNAVAILABLE ? 503 : 500 }
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

      const success = await serverStorage.deleteSubscription(session.user.id, params.id);

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
  } catch (error) {
    console.error(`DELETE /api/subscriptions/${params.id} error:`, error);
    
    // Use our standardized error response
    const errorResponse = createErrorResponse(error);
    
    return NextResponse.json(
      { error: errorResponse.error, code: errorResponse.code },
      { status: error.code === MongoDBErrorCode.SERVICE_UNAVAILABLE ? 503 : 500 }
    );
  }
}
