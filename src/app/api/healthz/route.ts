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
    if (health.status === 'healthy' && SubscriptionModel.db) {
      const collections = await SubscriptionModel.db.listCollections().map(col => col.name).toArray();
      schemaHealth.collections = collections;
    }

    return NextResponse.json({
      ...health,
      schemas: schemaHealth,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[Health Check] Error:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}