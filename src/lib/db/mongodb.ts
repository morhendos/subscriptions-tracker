const mongoose = require('mongoose');

if (!process.env.MONGODB_URI) {
  throw new Error('Please define MONGODB_URI environment variable');
}

const MONGODB_URI = process.env.MONGODB_URI;

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) {
    console.log('Using cached MongoDB connection');
    return cached.conn;
  }

  console.log('Creating new MongoDB connection...');

  try {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });

    cached.conn = await cached.promise;
    console.log('Successfully connected to MongoDB');
    return cached.conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

async function disconnectFromDatabase() {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
  }
}

module.exports = { connectToDatabase, disconnectFromDatabase };
