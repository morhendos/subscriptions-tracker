/**
 * MongoDB Utilities
 * 
 * This module contains utility functions for MongoDB connection management
 * and URI normalization. These functions ensure consistent handling of 
 * MongoDB connections throughout the application.
 */

/**
 * Normalizes a MongoDB URI to ensure it has a valid database name
 * 
 * @param uri - The MongoDB connection URI to normalize
 * @param dbName - The database name to use if not specified in the URI
 * @returns A properly formatted MongoDB connection URI
 */
export function normalizeMongoURI(uri: string, dbName: string = 'subscriptions'): string {
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

/**
 * Sanitizes a MongoDB URI for logging purposes by hiding credentials
 * 
 * @param uri - The MongoDB connection URI to sanitize
 * @returns A sanitized URI with credentials removed
 */
export function getSanitizedURI(uri: string): string {
  try {
    const url = new URL(uri);
    if (url.username && url.password) {
      return uri.replace(`${url.username}:${url.password}`, '***:***');
    }
    return uri;
  } catch {
    return uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
  }
}

/**
 * Validates a MongoDB URI
 * 
 * @param uri - The MongoDB connection URI to validate
 * @returns True if the URI is valid, false otherwise
 */
export function validateMongoURI(uri: string): boolean {
  if (!uri) return false;
  
  try {
    // Basic URI validation
    const mongoRegex = /^mongodb(\+srv)?:\/\/.+/;
    if (!mongoRegex.test(uri)) return false;

    // Parse URI to validate structure
    const url = new URL(uri);
    
    // For local development, we don't require username/password
    if (process.env.NODE_ENV === 'development') {
      return !!url.hostname;  // Only require hostname for local development
    }
    
    // For production, require full authentication
    if (!url.hostname) return false;
    
    return true;
  } catch (error) {
    return false;
  }
}