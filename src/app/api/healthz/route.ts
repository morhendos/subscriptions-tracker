import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/db/mongodb';
import { SubscriptionModel } from '@/models/subscription';
import mongoose from 'mongoose';

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
      const collections = await mongoose.connection.db.collections();
      schemaHealth.collections = collections.map(col => col.collectionName);
    }

    return NextResponse.json({
      ...health,
      schemas: schemaHealth,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    let errorMessage = 'Failed to check database health';
    if (error instanceof mongoose.mongo.MongoError) {
      errorMessage = `MongoDB Error: ${error.message}`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    console.error('[Health Check] Error:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}