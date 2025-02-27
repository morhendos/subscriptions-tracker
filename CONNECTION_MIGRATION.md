# MongoDB Connection Migration Guide

This document provides instructions for migrating from the Phase 2 connection manager to the simplified connection manager.

## Overview

The Phase 2 connection manager had some issues with premature disconnections that caused errors like:

```
MongoNotConnectedError: Client must be connected before running operations
```

The simplified connection manager provides a more reliable connection pattern by:

1. Maintaining a persistent connection
2. Properly handling connection lifecycle
3. Preventing premature disconnections
4. Providing proper error handling and serialization

## How to Migrate

Replace imports in your files:

```typescript
// From this:
import { withConnection } from '@/lib/db';

// To this:
import { withConnection, safeSerialize } from '@/lib/db/simplified-connection';
```

## API Differences

### The Old Way (Problematic)

```typescript
const result = await withConnection(async (connection) => {
  return Model.find({ ... });
});
```

### The New Way (Reliable)

```typescript
const result = await withConnection(async () => {
  return Model.find({ ... });
});
```

Key differences:
- The new `withConnection` doesn't pass a connection parameter
- The new version doesn't automatically disconnect after the operation

## Files Already Updated

The following files have been updated to use the new connection manager:

- `src/app/auth-actions.ts` - Authentication actions
- `src/lib/auth/auth-options.ts` - NextAuth.js options
- `src/app/api/storage/route.ts` - Storage API route

## Serializing Mongoose Documents

When returning Mongoose documents, use the `safeSerialize` function to prevent circular reference errors:

```typescript
import { safeSerialize } from '@/lib/db/simplified-connection';

// ...

return {
  data: safeSerialize(mongooseDocument)
};
```

## Debugging Connection Issues

If you encounter database connection issues, use the `/auth-debug` route which provides:

1. Database connection testing
2. Authentication diagnostics
3. Test user creation

## Why This Approach Works Better

The original Phase 2 connection manager had a critical flaw in its design:

```typescript
export async function withConnection<T>(
  operation: (connection: mongoose.Connection) => Promise<T>,
  options?: ConnectionOptions
): Promise<T> {
  const { connection, cleanup } = await getDirectConnection(options);
  
  try {
    return await operation(connection);
  } finally {
    await cleanup(); // Closed connection prematurely
  }
}
```

This would close the connection before operations were fully complete, causing errors.

The new approach uses a singleton connection pattern that's more reliable:

```typescript
export async function withConnection<T>(
  operation: () => Promise<T>
): Promise<T> {
  // Get a connection (or reuse existing one)
  await getConnection();
  
  // Run the operation (no cleanup afterward)
  return await operation();
}
```

## Future Considerations

Consider these tips when working with MongoDB in this application:

1. Connection pooling is better than creating/destroying connections for each operation
2. Handle MongoDB document serialization carefully to avoid circular references
3. Add appropriate error handling for timeouts and connection issues
4. Use reasonable timeouts for operations, especially in API routes
