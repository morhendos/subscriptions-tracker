import mongoose from 'mongoose';

declare global {
  var mongoose: { conn: mongoose.Connection | null, promise: Promise<mongoose.Connection> | null } | undefined;
}

if (!process.env.MONGODB_URI) {
  throw new Error('Please define MONGODB_URI environment variable');
}

const MONGODB_URI = process.env.MONGODB_URI;

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    console.log('[MongoDB] Using cached connection');
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      connectTimeoutMS: 20000, // 20 seconds
      socketTimeoutMS: 45000,  // 45 seconds
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 20000, // 20 seconds
    };

    console.log('[MongoDB] Creating new connection...');
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('[MongoDB] Connected successfully');
      return mongoose.connection;
    }).catch((error) => {
      console.error('[MongoDB] Connection error:', error);
      cached.promise = null;
      throw error;
    });
  } else {
    console.log('[MongoDB] Using existing connection promise');
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    console.error('[MongoDB] Failed to establish connection:', error);
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
      console.log('[MongoDB] Disconnected successfully');
    } catch (error) {
      console.error('[MongoDB] Disconnect error:', error);
      throw error;
    }
  }
}