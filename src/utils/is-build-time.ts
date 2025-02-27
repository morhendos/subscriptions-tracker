/**
 * Utility to detect if code is running during build time
 * 
 * This is particularly important for Next.js applications to determine whether 
 * code is executing during the build phase (static generation) vs runtime (server).
 */

// Check for next build or static export
export const isBuildTime = (): boolean => {
  // Check if running in a Node.js environment
  if (typeof process === 'undefined') {
    return false;
  }
  
  // Check for Next.js specific environment variables
  if (process.env.NEXT_PHASE === 'phase-production-build' || 
      process.env.NEXT_PHASE === 'phase-export') {
    return true;
  }
  
  // Check for CI environments
  if (process.env.CI || process.env.VERCEL_ENV) {
    return true;
  }
  
  // Check for command line arguments - this helps detect if we're running in a build script
  if (process.argv.includes('build') || 
      process.argv.includes('export') || 
      process.argv.includes('generate')) {
    return true;
  }
  
  // Check if we're being called from next build
  const stack = new Error().stack || '';
  if (stack.includes('next/dist/build') || stack.includes('static-generation')) {
    return true;
  }
  
  return false;
};

/**
 * Determine if we're in a server-side rendering context
 */
export const isSSR = (): boolean => {
  return typeof window === 'undefined';
};

/**
 * All-in-one check for if we should use mock services
 * This is true during build time or in test environments
 */
export const shouldUseMocks = (): boolean => {
  // Check for test environment first
  const isTestEnv = process.env.NODE_ENV === 'test';
  
  // Use mocks in test environment and during build time
  return isTestEnv || isBuildTime();
};

export default { isBuildTime, isSSR, shouldUseMocks };
