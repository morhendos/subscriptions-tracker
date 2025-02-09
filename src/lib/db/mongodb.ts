import mongoose from 'mongoose';

declare global {
  var mongoose: { conn: mongoose.Connection | null, promise: Promise<mongoose.Connection> | null } | undefined;
}

if (!process.env.MONGODB_URI) {
  throw new Error('Please define MONGODB_URI environment variable');
}

const isDev = process.env.NODE_ENV === 'development';

// Hide sensitive info in logs
const logUri = process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
console.log('[MongoDB] URI:', logUri);

const MONGODB_URI = process.env.MONGODB_URI;

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    isDev && console.log('[MongoDB] Using cached connection');
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
    };

    isDev && console.log('[MongoDB] Creating new connection...');
    
    // Only enable Mongoose debug in development
    if (isDev) {
      mongoose.set('debug', { 
        shell: true,
        color: true,
      });
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongoose) => {
        isDev && console.log('[MongoDB] Connected successfully');
        return mongoose.connection;
      })
      .catch((error) => {
        console.error('[MongoDB] Connection error:', error.message);
        cached.promise = null;
        throw error;
      });
  } else {
    isDev && console.log('[MongoDB] Using existing connection promise');
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error: any) {
    console.error('[MongoDB] Failed to establish connection:', error.message);
    cached.promise = null;
    throw error;
  }
}

export async function disconnectFromDatabase() {
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