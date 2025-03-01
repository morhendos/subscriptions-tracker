import { NextRequest, NextResponse } from 'next/server';
import { getStorageItem, saveStorageItem, deleteStorageItem } from '@/lib/services/storage-service';
import { Subscription } from '@/types/subscriptions';
import { createErrorResponse } from '@/lib/db/unified-error-handler';
import { MongoDBErrorCode } from '@/lib/db/error-handler';

/**
 * GET /api/storage
 * 
 * Retrieves stored subscriptions for a user
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

    // Use the storage service to retrieve data
    const subscriptions = await getStorageItem(key);
    return NextResponse.json(subscriptions);
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
    const { key, value } = await request.json();
    
    if (!key) {
      return NextResponse.json(
        { error: 'Key is required', code: 'validation.required_field' }, 
        { status: 400 }
      );
    }

    // Use the storage service to save data
    const subscriptions = await saveStorageItem(key, value);
    
    return NextResponse.json({ 
      success: true, 
      subscriptions 
    });
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
    if (!key) {
      return NextResponse.json(
        { error: 'Key is required', code: 'validation.required_field' }, 
        { status: 400 }
      );
    }

    // Use the storage service to delete data
    await deleteStorageItem(key);
    
    return NextResponse.json({ success: true });
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
