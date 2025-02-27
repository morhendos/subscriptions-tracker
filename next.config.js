/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  env: {
    // Set flag during build to detect static build environment
    // This is used by the build-detection utility
    NEXT_STATIC_BUILD: process.env.NODE_ENV === 'production' ? 'true' : 'false',
  },
};

// Detect build phase
if (process.env.PHASE_PRODUCTION_BUILD || 
    process.env.PHASE_EXPORT || 
    process.env.NEXT_PHASE) {
  console.log('[Build] Detected Next.js build environment, bypassing database connections...');
  process.env.NEXT_PHASE = process.env.NEXT_PHASE || 'build';
  process.env.NEXT_STATIC_BUILD = 'true';
  
  // Set flag to allow explicitly bypassing this behavior if needed
  if (!process.env.ALLOW_DB_DURING_BUILD) {
    process.env.ALLOW_DB_DURING_BUILD = 'false';
  }
}

module.exports = nextConfig;
