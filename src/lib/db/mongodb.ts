import mongoose from 'mongoose';
import { getMongoConfig, validateMongoURI, getSanitizedURI } from './config';

declare global {
  var mongoose: {
    conn: mongoose.Connection | null;
    promise: Promise<mongoose.Connection> | null;
  } | undefined;
}

// Constants for retry mechanism
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const isDev = process.env.NODE_ENV === 'development';

class MongoConnectionError extends Error {
  constructor(message: string, public readonly retryCount: number) {
    super(message);
    this.name = 'MongoConnectionError';
  }
}

// Initialize cached connection
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Validate environment variables
const validateEnv = () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not defined');
  }

  if (!validateMongoURI(process.env.MONGODB_URI)) {
    throw new Error('MONGODB_URI environment variable is invalid');
  }
};

// Connect to MongoDB with retry mechanism
async function connectWithRetry(retryCount = 0): Promise<mongoose.Connection> {
  try {
    validateEnv();

    const uri = process.env.MONGODB_URI as string;
    isDev && console.log('[MongoDB] Connecting to:', getSanitizedURI(uri));

    const connection = await mongoose.connect(uri, getMongoConfig());
    isDev && console.log('[MongoDB] Connected successfully');

    // Set up connection monitoring
    connection.connection.on('disconnected', () => {
      console.warn('[MongoDB] Disconnected. Attempting to reconnect...');
    });

    connection.connection.on('reconnected', () => {
      console.log('[MongoDB] Reconnected successfully');
    });

    connection.connection.on('error', (err) => {
      console.error('[MongoDB] Connection error:', err);
    });

    return connection.connection;
  } catch (error: any) {
    if (retryCount < MAX_RETRIES) {
      console.warn(`[MongoDB] Connection attempt ${retryCount + 1} failed. Retrying in ${RETRY_DELAY_MS}ms...`);
      console.error('[MongoDB] Error:', error.message);
      
      await delay(RETRY_DELAY_MS * (retryCount + 1));
      return connectWithRetry(retryCount + 1);
    }

    throw new MongoConnectionError(
      `Failed to connect to MongoDB after ${MAX_RETRIES} attempts: ${error.message}`,
      retryCount
    );
  }
}

// Main connection function
export async function connectToDatabase(): Promise<mongoose.Connection> {
  if (cached.conn) {
    isDev && console.log('[MongoDB] Using cached connection');
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = connectWithRetry()
      .catch((error) => {
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error: any) {
    cached.promise = null;
    throw error;
  }
}

// Disconnect function with proper cleanup
export async function disconnectFromDatabase(): Promise<void> {
  if (cached.conn) {
    try {
      await mongoose.disconnect();
      cached.conn = null;
      cached.promise = null;
      isDev && console.log('[MongoDB] Disconnected successfully');
    } catch (error: any) {
      console.error('[MongoDB] Disconnect error:', error.message);
      throw error;
    }
  }
}

// Health check function
export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  latency: number;
  message?: string;
}> {
  try {
    const startTime = Date.now();
    const adminDb = mongoose.connection.db.admin();
    await adminDb.ping();
    const latency = Date.now() - startTime;

    return {
      status: 'healthy',
      latency,
      message: 'Database is responding normally'
    };
  } catch (error: any) {
    return {
      status: 'unhealthy',
      latency: -1,
      message: `Database health check failed: ${error.message}`
    };
  }
}