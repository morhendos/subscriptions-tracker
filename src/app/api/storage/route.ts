import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionModel, SubscriptionDocument } from '@/models/subscription';
import mongoose from 'mongoose';
import { Subscription } from '@/types/subscriptions';
import { getAtlasConfig } from '@/lib/db/atlas-config';

const STORAGE_KEY_PREFIX = 'subscriptions';

// Helper to extract userId from storage key
function extractUserId(key: string): string | null {
  if (!key.startsWith(STORAGE_KEY_PREFIX + '_')) {
    return null;
  }
  return key.slice(STORAGE_KEY_PREFIX.length + 1);
}

// Direct connection to MongoDB with robust URI handling
async function createDirectConnection(): Promise<mongoose.Connection> {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not defined');
  }

  // Get Atlas configuration
  const atlasConfig = getAtlasConfig(process.env.NODE_ENV);
  
  // Log the sanitized URI (hiding credentials)
  const sanitizedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//[username]:[hidden]@');
  console.log('Storage API: Attempting MongoDB connection to:', sanitizedUri);
  
  // Use the normalizeMongoURI function to ensure proper database name
  const dbName = 'subscriptions';
  const normalizedUri = normalizeMongoURI(uri, dbName);
  
  console.log('Storage API: Connecting with normalized URI');
  
  try {
    // Connect with a direct connection
    const mongooseInstance = await mongoose.connect(normalizedUri, {
      ...atlasConfig,
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      connectTimeoutMS: 10000, // 10 second timeout
    });
    
    console.log('Storage API: MongoDB connection established successfully!');
    
    if (!mongooseInstance.connection.db) {
      throw new Error('Database connection not fully established');
    }
    
    return mongooseInstance.connection;
  } catch (error) {
    console.error('Storage API: MongoDB connection failed with error:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// Parse and normalize MongoDB URI to ensure it has a valid database name
function normalizeMongoURI(uri: string, dbName: string = 'subscriptions'): string {
  try {
    // Parse the URI to properly handle different URI formats
    const url = new URL(uri);
    
    // Extract the current path (which might contain a database name)
    let path = url.pathname;
    
    // Check if the path is just a slash or empty, or contains an invalid database name
    if (path === '/' || path === '' || path.includes('_/')) {
      // Replace the path with just the database name
      url.pathname = `/${dbName}`;
    } else {
      // If the path already has a database name (but not the one we want)
      // We extract everything before any query parameters and replace the db name
      
      // Remove any query parameters from consideration
      const pathWithoutQuery = path.split('?')[0];
      
      // Check if the path already has our desired database name
      if (pathWithoutQuery === `/${dbName}`) {
        // Nothing to do, correct database name is already in the path
      } else {
        // Replace whatever database name is there with our desired one
        url.pathname = `/${dbName}`;
      }
    }
    
    // Ensure we have the necessary query parameters
    const searchParams = new URLSearchParams(url.search);
    if (!searchParams.has('retryWrites')) {
      searchParams.set('retryWrites', 'true');
    }
    if (!searchParams.has('w')) {
      searchParams.set('w', 'majority');
    }
    
    // Update the search parameters
    url.search = searchParams.toString();
    
    // Return the properly formatted URI
    return url.toString();
  } catch (error) {
    // If URL parsing fails, fall back to a more basic string manipulation
    console.warn('Failed to parse MongoDB URI as URL, falling back to string manipulation');
    
    // Remove any existing database name and query parameters
    let baseUri = uri;
    
    // Check for presence of query parameters
    const queryIndex = baseUri.indexOf('?');
    if (queryIndex > -1) {
      baseUri = baseUri.substring(0, queryIndex);
    }
    
    // Ensure URI ends with a single slash
    if (!baseUri.endsWith('/')) {
      baseUri = `${baseUri}/`;
    }
    
    // Append database name and query parameters
    return `${baseUri}${dbName}?retryWrites=true&w=majority`;
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const key = searchParams.get('key');

  if (!key) {
    return NextResponse.json({ error: 'Key is required' }, { status: 400 });
  }

  const userId = extractUserId(key);
  if (!userId) {
    return NextResponse.json({ error: 'Invalid key format' }, { status: 400 });
  }

  let connection: mongoose.Connection | null = null;
  
  try {
    // Use our direct connection with robust URI handling
    connection = await createDirectConnection();
    
    const subscriptions = await SubscriptionModel.find({ userId })
      .sort({ nextBillingDate: 1 })
      .lean();

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
  } catch (error) {
    console.error('Storage API Error:', error);
    
    let errorMessage = 'Failed to read data';
    if (error instanceof mongoose.mongo.MongoError) {
      errorMessage = `MongoDB Error: ${error.message}`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  } finally {
    // Always ensure we close the connection
    if (connection) {
      try {
        await mongoose.disconnect();
        console.log('Storage API: Database connection closed');
      } catch (error) {
        console.error('Storage API: Error closing database connection:', error);
      }
    }
  }
}

export async function POST(request: NextRequest) {
  let connection: mongoose.Connection | null = null;
  
  try {
    const { key, value } = await request.json();
    
    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    const userId = extractUserId(key);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid key format' }, { status: 400 });
    }

    // Use our direct connection with robust URI handling
    connection = await createDirectConnection();

    const subscriptions = value;

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
      const insertedSubscriptions = result.map((doc): Subscription => ({
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

      return NextResponse.json({ success: true, subscriptions: insertedSubscriptions });
    }

    return NextResponse.json({ success: true, subscriptions: [] });
  } catch (error) {
    console.error('Storage API Error:', error);
    
    let errorMessage = 'Failed to write data';
    if (error instanceof mongoose.mongo.MongoError) {
      errorMessage = `MongoDB Error: ${error.message}`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  } finally {
    // Always ensure we close the connection
    if (connection) {
      try {
        await mongoose.disconnect();
        console.log('Storage API: Database connection closed');
      } catch (error) {
        console.error('Storage API: Error closing database connection:', error);
      }
    }
  }
}

export async function DELETE(request: NextRequest) {
  let connection: mongoose.Connection | null = null;
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    const userId = extractUserId(key);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid key format' }, { status: 400 });
    }

    // Use our direct connection with robust URI handling
    connection = await createDirectConnection();
    
    await SubscriptionModel.deleteMany({ userId });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Storage API Error:', error);
    
    let errorMessage = 'Failed to delete data';
    if (error instanceof mongoose.mongo.MongoError) {
      errorMessage = `MongoDB Error: ${error.message}`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  } finally {
    // Always ensure we close the connection
    if (connection) {
      try {
        await mongoose.disconnect();
        console.log('Storage API: Database connection closed');
      } catch (error) {
        console.error('Storage API: Error closing database connection:', error);
      }
    }
  }
}