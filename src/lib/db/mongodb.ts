import mongoose from 'mongoose';
import { getAtlasConfig, getMonitoringConfig } from './atlas-config';
import { validateMongoURI, getSanitizedURI } from './config';

interface GlobalMongoose {
  conn: mongoose.Connection | null;
  promise: Promise<mongoose.Connection> | null;
}

declare global {
  var mongoose: GlobalMongoose | undefined;
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
const cached: GlobalMongoose = global.mongoose ?? { conn: null, promise: null };
if (!global.mongoose) {
  global.mongoose = cached;
}

// Helper function to delay execution with exponential backoff
const delay = (retryCount: number) => 
  new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * Math.pow(2, retryCount)));

// Rest of the file remains the same...
[Previous mongodb.ts content from line 38 onwards]