/**
 * Environment Variables Debug Utility
 * 
 * This utility helps diagnose issues with environment variable loading
 * by providing manual loading and detailed logging.
 */
import * as fs from 'fs';
import * as path from 'path';

export function loadEnvVars() {
  console.log('\n[ENV DEBUG] Starting environment variables check...');
  
  // Check if dotenv is available
  try {
    // We use require instead of import to avoid issues if dotenv isn't installed
    const dotenv = require('dotenv');
    console.log('[ENV DEBUG] dotenv package is available');

    // Check for the existence of .env.local
    const rootDir = process.cwd();
    const envLocalPath = path.join(rootDir, '.env.local');
    
    console.log(`[ENV DEBUG] Looking for .env.local at: ${envLocalPath}`);
    
    if (fs.existsSync(envLocalPath)) {
      console.log('[ENV DEBUG] .env.local file exists');
      
      try {
        // Read file content to check format (but don't log secrets)
        const envContent = fs.readFileSync(envLocalPath, 'utf8');
        const envLines = envContent.split('\n').filter(line => line.trim() !== '');
        console.log(`[ENV DEBUG] .env.local contains ${envLines.length} non-empty lines`);
        
        // Check for MongoDB URI specifically (without logging the full value)
        const mongoLine = envLines.find(line => line.startsWith('MONGODB_URI='));
        if (mongoLine) {
          const mongoValue = mongoLine.substring('MONGODB_URI='.length);
          console.log(`[ENV DEBUG] MONGODB_URI is defined in .env.local (value starts with: ${mongoValue.substring(0, 15)}...)`);
        } else {
          console.log('[ENV DEBUG] MONGODB_URI is NOT defined in .env.local');
        }
        
        // Try to manually load the env file
        dotenv.config({ path: envLocalPath });
        console.log('[ENV DEBUG] Attempted to load .env.local with dotenv.config()');
      } catch (err) {
        console.error('[ENV DEBUG] Error reading or parsing .env.local:', err);
      }
    } else {
      console.log('[ENV DEBUG] .env.local file does NOT exist!');
      
      // Check for other env files
      const envFiles = ['.env', '.env.development', '.env.local.example'];
      for (const file of envFiles) {
        const filePath = path.join(rootDir, file);
        if (fs.existsSync(filePath)) {
          console.log(`[ENV DEBUG] Found alternative env file: ${file}`);
        }
      }
    }
  } catch (err) {
    console.error('[ENV DEBUG] dotenv package is not available:', err);
  }
  
  // Log current environment variables (safely)
  console.log('\n[ENV DEBUG] Current environment variables:');
  const mongoVars = Object.keys(process.env)
    .filter(key => key.includes('MONGODB') || key.includes('NEXTAUTH'))
    .sort();
    
  if (mongoVars.length > 0) {
    for (const key of mongoVars) {
      // Don't log secrets in full
      const value = key.includes('SECRET') || key.includes('URI') || key.includes('URL')
        ? `[REDACTED - ${typeof process.env[key]} with length ${String(process.env[key]).length}]`
        : process.env[key];
        
      console.log(`[ENV DEBUG]   - ${key}: ${value}`);
    }
  } else {
    console.log('[ENV DEBUG]   No MongoDB or NextAuth related variables found');
  }
  
  console.log('[ENV DEBUG] Environment check complete\n');
}

/**
 * Force-set environment variables when missing
 * This is a fallback mechanism to ensure critical variables are always available
 */
export function ensureEnvVars() {
  // Only apply fallbacks if variables are missing
  if (!process.env.MONGODB_URI) {
    console.log('[ENV DEBUG] MONGODB_URI is missing, applying fallback value');
    process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/subscriptions';
  }
  
  if (!process.env.NEXTAUTH_SECRET) {
    console.log('[ENV DEBUG] NEXTAUTH_SECRET is missing, applying fallback value');
    // Generate a secure random string - not ideal but better than failing
    process.env.NEXTAUTH_SECRET = require('crypto').randomBytes(32).toString('hex');
  }
  
  if (!process.env.NEXTAUTH_URL && process.env.NODE_ENV === 'development') {
    console.log('[ENV DEBUG] NEXTAUTH_URL is missing, applying fallback value for development');
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
  }
}
