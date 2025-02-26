/**
 * Environment Variables Debug Utility
 * 
 * This utility helps diagnose issues with environment variable loading
 * by providing manual loading and detailed logging.
 */
import * as fs from 'fs';
import * as path from 'path';

// Keep track of whether we've already loaded env vars to avoid duplicate operations
let envVarsLoaded = false;

export function loadEnvVars() {
  // Skip if already loaded to avoid duplicate loading
  if (envVarsLoaded) {
    return;
  }
  
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
      
      // Try loading other env files in order of preference
      const envFiles = ['.env', '.env.development', '.env.local.example'];
      
      for (const file of envFiles) {
        const filePath = path.join(rootDir, file);
        if (fs.existsSync(filePath)) {
          console.log(`[ENV DEBUG] Found alternative env file: ${file}, trying to load it...`);
          
          try {
            dotenv.config({ path: filePath });
            console.log(`[ENV DEBUG] Loaded ${file} with dotenv.config()`);
            break; // Stop after the first successful load
          } catch (err) {
            console.error(`[ENV DEBUG] Error loading ${file}:`, err);
          }
        }
      }
    }
  } catch (err) {
    console.error('[ENV DEBUG] dotenv package is not available:', err);
  }
  
  // Log current environment variables (safely)
  console.log('\n[ENV DEBUG] Current environment variables:');
  const relevantVars = Object.keys(process.env)
    .filter(key => key.includes('MONGODB') || key.includes('NEXTAUTH') || key.includes('DATABASE'))
    .sort();
    
  if (relevantVars.length > 0) {
    for (const key of relevantVars) {
      // Don't log secrets in full
      const value = key.includes('SECRET') || key.includes('URI') || key.includes('URL') || key.includes('PASSWORD')
        ? `[REDACTED - ${typeof process.env[key]} with length ${String(process.env[key]).length}]`
        : process.env[key];
        
      console.log(`[ENV DEBUG]   - ${key}: ${value}`);
    }
  } else {
    console.log('[ENV DEBUG]   No MongoDB or NextAuth related variables found');
  }
  
  console.log('[ENV DEBUG] Environment check complete\n');
  
  // Mark as loaded to avoid duplicate operations
  envVarsLoaded = true;
}

/**
 * Force-set environment variables when missing
 * This is a fallback mechanism to ensure critical variables are always available
 */
export function ensureEnvVars() {
  // Add additional logging to help with debugging
  console.log('\n[ENV DEBUG] Ensuring critical environment variables are set...');

  // Only apply fallbacks if variables are missing
  if (!process.env.MONGODB_URI) {
    console.log('[ENV DEBUG] MONGODB_URI is missing, applying fallback value');
    const fallbackURI = 'mongodb://127.0.0.1:27017/subscriptions';
    process.env.MONGODB_URI = fallbackURI;
    console.log(`[ENV DEBUG] Set MONGODB_URI to: ${fallbackURI}`);
  } else {
    console.log('[ENV DEBUG] MONGODB_URI is already set');
  }
  
  if (!process.env.MONGODB_DATABASE) {
    console.log('[ENV DEBUG] MONGODB_DATABASE is missing, applying fallback value');
    process.env.MONGODB_DATABASE = 'subscriptions';
    console.log('[ENV DEBUG] Set MONGODB_DATABASE to: subscriptions');
  }
  
  if (!process.env.NEXTAUTH_SECRET) {
    console.log('[ENV DEBUG] NEXTAUTH_SECRET is missing, applying fallback value');
    // Generate a secure random string - not ideal but better than failing
    const crypto = require('crypto');
    const secret = crypto.randomBytes(32).toString('hex');
    process.env.NEXTAUTH_SECRET = secret;
    console.log(`[ENV DEBUG] Generated random NEXTAUTH_SECRET (length: ${secret.length})`);
  } else {
    console.log('[ENV DEBUG] NEXTAUTH_SECRET is already set');
  }
  
  if (!process.env.NEXTAUTH_URL && process.env.NODE_ENV === 'development') {
    console.log('[ENV DEBUG] NEXTAUTH_URL is missing, applying fallback value for development');
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    console.log('[ENV DEBUG] Set NEXTAUTH_URL to: http://localhost:3000');
  } else if (process.env.NEXTAUTH_URL) {
    console.log('[ENV DEBUG] NEXTAUTH_URL is already set');
  }
  
  // Add some additional timeouts as fallbacks to prevent connection issues
  if (!process.env.MONGODB_CONNECTION_TIMEOUT) {
    console.log('[ENV DEBUG] MONGODB_CONNECTION_TIMEOUT is missing, applying fallback value');
    process.env.MONGODB_CONNECTION_TIMEOUT = '30000'; // 30 seconds
    console.log('[ENV DEBUG] Set MONGODB_CONNECTION_TIMEOUT to: 30000');
  }
  
  if (!process.env.MONGODB_SERVER_SELECTION_TIMEOUT) {
    console.log('[ENV DEBUG] MONGODB_SERVER_SELECTION_TIMEOUT is missing, applying fallback value');
    process.env.MONGODB_SERVER_SELECTION_TIMEOUT = '15000'; // 15 seconds
    console.log('[ENV DEBUG] Set MONGODB_SERVER_SELECTION_TIMEOUT to: 15000');
  }
  
  if (!process.env.MONGODB_SOCKET_TIMEOUT) {
    console.log('[ENV DEBUG] MONGODB_SOCKET_TIMEOUT is missing, applying fallback value');
    process.env.MONGODB_SOCKET_TIMEOUT = '60000'; // 60 seconds
    console.log('[ENV DEBUG] Set MONGODB_SOCKET_TIMEOUT to: 60000');
  }
  
  console.log('[ENV DEBUG] Environment variable checks complete\n');
}
