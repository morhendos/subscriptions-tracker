import mongoose from 'mongoose';

// For TypeScript global augmentation
declare global {
  var _mongoClientPromise: Promise<typeof mongoose> | undefined;
}

if (!process.env.MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

const MONGODB_URI = process.env.MONGODB_URI;

let clientPromise: Promise<typeof mongoose>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = mongoose.connect(MONGODB_URI);
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  clientPromise = mongoose.connect(MONGODB_URI);
}

export default clientPromise;
