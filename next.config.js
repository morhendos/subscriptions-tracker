/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed the serverActions flag as it's enabled by default in Next.js 14.1.0
  env: {
    // Setting this environment variable will help identify build processes
    IS_BUILD_TIME: process.env.IS_BUILD_TIME || process.env.NEXT_PHASE?.includes('build') ? 'true' : 'false',
    // Force use of mock DB during builds
    USE_MOCK_DB: process.env.USE_MOCK_DB || (process.env.NEXT_PHASE?.includes('build') ? 'true' : 'false'),
  },
};

// Export the Next.js configuration
module.exports = nextConfig;
