# Build Process & MongoDB Connection Handling

This document explains how the application handles MongoDB connections during the build process.

## The Problem

During Next.js's static build and generation process, the application would attempt to connect to MongoDB even for pages that don't actually need database access. This led to:

- Build failures when MongoDB wasn't available
- Slow builds due to connection timeouts
- Excessive error logs in the build output

## The Solution

We've implemented a system that intelligently detects when the application is running in a build environment and provides mock database connections instead of trying to connect to a real MongoDB instance.

### Key Components

1. **Build Environment Detection**
   - Detects when the application is running in Next.js build process
   - Located in `src/lib/db/build-detection.ts`

2. **Mock Database Connection**
   - Provides a simulated MongoDB connection during builds
   - Implements all necessary interface methods
   - Located in `src/lib/db/mock-connection.ts`

3. **Environment Configuration**
   - Sets appropriate environment flags during build
   - Located in `next.config.js`

### How It Works

1. During build, `next.config.js` sets `NEXT_STATIC_BUILD=true` and other environment flags
2. The database module (`src/lib/db/index.ts`) checks for build environment using `shouldSkipDatabaseConnection()`
3. When in build environment, database access methods return mock connections/data
4. API endpoints that test database connectivity return mock responses during build

## Configuration Options

If you need to enable real database connections during build (not recommended), you can set:

```
ALLOW_DB_DURING_BUILD=true
```

This environment variable will force the application to attempt real MongoDB connections even during the build process.

## API Endpoints in Build Mode

The following API endpoints will return mock responses during build:

- `/api/health/db` - Returns mock health status
- `/api/test-db` - Returns mock connection status
- `/api/test-db-alt` - Returns mock direct connection status

## Best Practices

1. **API Routes**: Always use `shouldSkipDatabaseConnection()` to check if you should skip real DB connections
2. **Server Components**: Use the database module normally; it will automatically use mock connections during build
3. **Testing**: Set `ALLOW_DB_DURING_BUILD=true` if you need to test with real database during build
