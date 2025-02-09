import * as dotenv from 'dotenv';
import { resolve } from 'path';

console.log('Current working directory:', process.cwd());

const envPath = resolve(process.cwd(), '.env.local');
console.log('Looking for .env.local at:', envPath);

const result = dotenv.config({ path: envPath });
console.log('Dotenv loading result:', result);

console.log('Environment variables:', {
  MONGODB_URI: process.env.MONGODB_URI,
  NODE_ENV: process.env.NODE_ENV
});
