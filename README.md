# Subscription Tracker

Track and manage your recurring subscriptions with ease.

## Bug Fixes

### Fix for MongoDB Connection Errors During Build

This branch addresses the issue where the application attempts to connect to a MongoDB database during the Next.js build/static generation process, causing errors and build failures.

#### Changes Made:

1. **Added Build-Time Detection Utility**
   - Created a new utility module `src/utils/is-build-time.ts` with functions to detect when code is running during the Next.js build process.
   - Added `shouldUseMocks()` function to centralize mock connection decision logic.

2. **Fixed SSL Configuration for Localhost**
   - Added `isLocalConnection()` function to detect localhost URLs.
   - Modified database configuration to automatically disable SSL for localhost connections, avoiding TLS connection errors.
   - Added explicit environment variable override with `MONGODB_SSL`.

3. **Updated Connection Manager**
   - Modified `getConnection()` method to check for build-time environment.
   - Updated to return mock connections during build/test environments.
   - Added `forceMock` option to `ConnectionOptions` interface for explicit mock usage.

4. **Simplified Mock Connection Implementation**
   - Reduced complexity of mock implementation while maintaining compatibility.
   - Ensured proper TypeScript interface compliance.
   - Used JavaScript Proxy pattern to simplify mock implementation.

These changes ensure the application can be built successfully without requiring a running MongoDB instance, which is particularly important for CI/CD pipelines and local development.

## Development

To start the development server:

```bash
npm run dev
# or
yarn dev
```

## Database Configuration

The application supports various database configuration options through environment variables:

- `MONGODB_URI` - Connection URI for MongoDB
- `MONGODB_DATABASE` - Database name to use
- `MONGODB_SSL` - Set to 'true' or 'false' to explicitly enable/disable SSL
