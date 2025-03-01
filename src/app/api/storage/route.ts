import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionModel } from '@/models/subscription';
import { Subscription } from '@/types/subscriptions';
import mongoose from 'mongoose';
import { withConnection } from '@/lib/db/simplified-connection';
import { withErrorHandling, createErrorResponse } from '@/lib/db/unified-error-handler';
import { MongoDBErrorCode, MongoDBError } from '@/lib/db/error-handler';

const STORAGE_KEY_PREFIX = 'subscriptions';

// Helper to extract userId from storage key
function extractUserId(key: string): string | null {
  if (!key.startsWith(STORAGE_KEY_PREFIX + '_')) {
    return null;
  }
  return key.slice(STORAGE_KEY_PREFIX.length + 1);
}

/**
 * GET /api/storage
 * 
 * Retrieves stored subscriptions for a user
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const key = searchParams.get('key');

  try {
    return await withErrorHandling(async () => {
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

      const subscriptions = await withConnection(async () => {
        return SubscriptionModel.find({ userId })
          .sort({ nextBillingDate: 1 })
          .lean()
          .exec();
      });

      if (!subscriptions) {
        return NextResponse.json(
          { error: 'Failed to retrieve subscriptions data', code: 'database.error' }, 
          { status: 500 }
        );
      }

      const result = subscriptions.map((sub): Subscription => ({
        id: (sub._id as mongoose.Types.ObjectId).toString(),
        name: sub.name,
        price: sub.price,
        currency: sub.currency,
        billingPeriod: sub.billingPeriod,
        startDate: (sub.startDate as Date).toISOString(),
        nextBillingDate: (sub.nextBillingDate as Date).toISOString(),
        description: sub.description,
        disabled: sub.disabled,
        createdAt: (sub.createdAt as Date).toISOString(),
        updatedAt: (sub.updatedAt as Date).toISOString()
      }));

      return NextResponse.json(result);
    }, 'api/storage/GET');
  } catch (error: unknown) {
    console.error('Storage API GET error:', error);
    
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
 * POST /api/storage
 * 
 * Stores subscriptions for a user
 */
export async function POST(request: NextRequest) {
  try {
    return await withErrorHandling(async () => {
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

      const subscriptions = value;

      const result = await withConnection(async () => {
        // Delete existing subscriptions
        await SubscriptionModel.deleteMany({ userId });

        // Insert new subscriptions if any
        if (subscriptions && subscriptions.length > 0) {
          const docs = subscriptions.map((sub: Partial<Subscription>) => ({
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
          return result.map((doc): Subscription => ({
            id: doc._id.toString(),
            name: doc.name,
            price: doc.price,
            currency: doc.currency,
            billingPeriod: doc.billingPeriod,
            startDate: doc.startDate.toISOString(),
            nextBillingDate: doc.nextBillingDate.toISOString(),
            description: doc.description,
            disabled: doc.disabled,
            createdAt: doc.createdAt.toISOString(),
            updatedAt: doc.updatedAt.toISOString()
          }));
        }
        
        return [];
      });

      return NextResponse.json({ 
        success: true, 
        subscriptions: result 
      });
    }, 'api/storage/POST');
  } catch (error: unknown) {
    console.error('Storage API POST error:', error);
    
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
 * DELETE /api/storage
 * 
 * Deletes all subscriptions for a user
 */
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const key = searchParams.get('key');

  try {
    return await withErrorHandling(async () => {
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

      await withConnection(async () => {
        await SubscriptionModel.deleteMany({ userId });
      });
      
      return NextResponse.json({ success: true });
    }, 'api/storage/DELETE');
  } catch (error: unknown) {
    console.error('Storage API DELETE error:', error);
    
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
