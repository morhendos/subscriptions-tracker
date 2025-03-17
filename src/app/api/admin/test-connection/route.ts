import { NextRequest, NextResponse } from 'next/server';
import { withAuthConnection } from '@/lib/db/auth-connection';
import { WaitlistModel } from '@/models/waitlist';
import { getServerSession } from 'next-auth';
import { isAdmin } from '@/utils/auth';
import mongoose from 'mongoose';

// Add types for MongoDB collection stats
interface CollectionStats {
  ns: string;
  count: number;
  size: number;
  avgObjSize: number;
  storageSize: number;
  capped: boolean;
  nindexes: number;
  totalIndexSize: number;
  indexSizes: Record<string, number>;
  scaleFactor: number;
}

// Helper function to safely get a property from an object
function getProp(obj: any, prop: string): any {
  if (obj && typeof obj === 'object') {
    return obj[prop];
  }
  return undefined;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session || !isAdmin(session.user)) {
      return NextResponse.json(
        { error: 'Unauthorized', authorized: false },
        { status: 403 }
      );
    }

    // Get database info
    const diagnosticInfo = {
      timestamp: new Date().toISOString(),
      authorized: true,
      mongooseConnection: {
        readyState: mongoose.connection.readyState,
        readyStateText: getReadyStateText(mongoose.connection.readyState),
        models: Object.keys(mongoose.models),
        hasWaitlistModel: !!mongoose.models.Waitlist,
      },
      waitlistCollection: null as any,
      adminStatus: {
        isAdmin: isAdmin(session.user),
        userRoles: session.user.roles,
        userId: session.user.id,
      },
      envInfo: {
        nodeEnv: process.env.NODE_ENV,
        databaseName: process.env.DATABASE_NAME || 'Not set',
      }
    };

    // Test the waitlist connection
    try {
      const collectionInfo = await withAuthConnection(async () => {
        // Check if collection exists and count documents
        const count = await WaitlistModel.countDocuments().exec();
        
        // Get raw collection name
        const collectionName = WaitlistModel.collection.name;
        
        // Use command method to get stats (type-safe approach)
        const db = mongoose.connection.db;
        if (!db) {
          throw new Error('Database connection not available');
        }
        
        const collectionStats = await db.command({
          collStats: collectionName
        }) as CollectionStats;
        
        // Try to get a sample document (but don't return sensitive data)
        let sampleDoc = null;
        
        // Find one document and convert to a plain JavaScript object
        const sampleResult = await WaitlistModel.findOne().exec();
        
        if (sampleResult) {
          // Convert to plain object to avoid Mongoose document methods
          const plainObj = sampleResult.toObject();
          
          // Now build a safe representation with only the needed properties
          sampleDoc = {
            exists: true,
            id: plainObj._id ? plainObj._id.toString() : 'unknown',
            fields: Object.keys(plainObj),
            createdAt: plainObj.createdAt,
          };
        }
        
        return {
          exists: true,
          collectionName,
          documentCount: count,
          stats: {
            size: collectionStats.size,
            count: collectionStats.count,
            avgObjSize: collectionStats.avgObjSize,
          },
          sampleDocument: sampleDoc,
        };
      });

      diagnosticInfo.waitlistCollection = collectionInfo;
    } catch (error: any) {
      diagnosticInfo.waitlistCollection = {
        error: error.message,
        exists: false,
        stack: error.stack,
      };
    }

    return NextResponse.json(diagnosticInfo);
  } catch (error: any) {
    console.error('Test connection error:', error);
    return NextResponse.json(
      { 
        error: error.message,
        stack: error.stack,
        message: 'Error during connection test'
      },
      { status: 500 }
    );
  }
}

// Convert mongoose connection readyState to text
function getReadyStateText(state: number): string {
  switch (state) {
    case 0:
      return 'disconnected';
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    case 3:
      return 'disconnecting';
    case 99:
      return 'uninitialized';
    default:
      return 'unknown';
  }
}
