/**
 * Build Environment Detection
 * 
 * Provides utilities to detect build environment and mock database connections
 * when necessary during the build process.
 */

/**
 * Detect if we're running in the static build/generation environment
 */
export function isStaticBuildEnvironment(): boolean {
  // Check for Next.js build environment
  // NEXT_PHASE is set during build time
  if (process.env.NEXT_PHASE) {
    return ['build', 'generate', 'export'].includes(process.env.NEXT_PHASE);
  }
  
  // Check for traditional build environment variables
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_STATIC_BUILD === 'true') {
    return true;
  }
  
  // Check if we're in a static generation context based on stack trace
  const stack = new Error().stack || '';
  if (stack.includes('getStaticProps') || 
      stack.includes('getStaticPaths') || 
      stack.includes('generateStaticParams') ||
      stack.includes('generateMetadata')) {
    return true;
  }
  
  // Default to false
  return false;
}

/**
 * Check if we should allow database connections during build
 */
export function shouldSkipDatabaseConnection(): boolean {
  // Always allow connections in development or production runtime
  if (process.env.NODE_ENV === 'development') {
    return false;
  }
  
  // Skip in build/static generation environments
  if (isStaticBuildEnvironment()) {
    return process.env.ALLOW_DB_DURING_BUILD !== 'true';
  }
  
  // Allow connections by default
  return false;
}

/**
 * Check if current API route is a database test route
 */
export function isDatabaseTestRoute(): boolean {
  // Get the stack trace
  const stack = new Error().stack || '';
  
  // Check for test route paths in the stack
  return stack.includes('/api/test-db') || 
         stack.includes('/api/test-db-alt') || 
         stack.includes('/api/test-db-simple') ||
         stack.includes('/api/health/db');
}
