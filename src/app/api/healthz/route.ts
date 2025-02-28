import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/db/mongodb';
import { SubscriptionModel } from '@/models/subscription';
import mongoose from 'mongoose';
import { createErrorResponse } from '@/lib/db/unified-error-handler';

export async function GET() {
  try {
    // Basic database health check
    const health = await checkDatabaseHealth();
    
    // Additional schema verification
    const schemaHealth = {
      subscriptionModel: !!SubscriptionModel,
      collections: [] as string[]
    };

    // If database is connected, check collections
    if (health.status === 'healthy' && 
        mongoose.connection.readyState === 1 && // 1 = connected
        mongoose.connection.db) {
      try {
        const collections = await mongoose.connection.db.collections();
        schemaHealth.collections = collections.map(col => col.collectionName);
      } catch (collectionError) {
        console.warn('[Health Check] Error fetching collections:', collectionError);
        // Continue without collections data rather than failing completely
      }
    }

    return NextResponse.json({
      ...health,
      schemas: schemaHealth,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // Use the unified error handler
    const errorResponse = createErrorResponse(error, process.env.NODE_ENV === 'development');
    
    console.error('[Health Check] Error:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: errorResponse.error,
        code: errorResponse.code,
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' ? { details: errorResponse.details } : {})
      },
      { status: 500 }
    );
  }
}