# Error Handling for MongoDB Operations

This document outlines the standardized error handling approach for MongoDB operations in the Subscription Tracker application.

## Overview

The application uses a unified error handling system to ensure consistent error responses across all API endpoints. This helps both the frontend to display appropriate messages and makes the backend code more maintainable.

## Key Components

1. **MongoDBErrorCode Enum** - Defines standardized error codes for different types of MongoDB errors
2. **MongoDBError Class** - Custom error class that includes a code and original error reference
3. **createErrorResponse Function** - Creates standardized API error responses
4. **withErrorHandling Function** - Wrapper for async operations with built-in error handling

## Implementation Details

### Error Response Structure

All error responses follow this structure:

```typescript
{
  error: string;      // User-friendly error message
  code: string;       // Error code (e.g., 'mongodb.connection_failed')
  details?: object;   // Optional technical details (only in development)
}
```

### HTTP Status Codes

The system maps error types to appropriate HTTP status codes:

- **503 Service Unavailable** - For connection-related errors:
  - `MongoDBErrorCode.CONNECTION_FAILED`
  - `MongoDBErrorCode.CONNECTION_TIMEOUT`
- **400 Bad Request** - For validation errors
- **404 Not Found** - For resource not found errors
- **500 Internal Server Error** - For all other errors

### Usage in API Routes

When implementing API routes, follow this pattern:

```typescript
export async function GET(request: NextRequest) {
  try {
    return await withErrorHandling(async () => {
      // Your business logic here
    }, 'context-description');
  } catch (error: unknown) {
    console.error('Error context:', error);
    
    // Use standardized error response
    const errorResponse = createErrorResponse(error);
    
    return NextResponse.json(
      { error: errorResponse.error, code: errorResponse.code },
      { 
        status: (errorResponse.code === MongoDBErrorCode.CONNECTION_FAILED || 
                errorResponse.code === MongoDBErrorCode.CONNECTION_TIMEOUT) ? 503 : 500 
      }
    );
  }
}
```

### Important Type Safety Notes

1. Always add the `: unknown` type annotation to catch block error variables
2. Never directly access properties on the raw error object (use errorResponse instead)
3. Import both `MongoDBErrorCode` and `MongoDBError` for completeness

## Best Practices

1. **Use withErrorHandling for database operations:**
   ```typescript
   await withErrorHandling(async () => {
     // Your database operation here
   }, 'operation-context');
   ```

2. **Create user-friendly error messages:**
   - Keep error messages concise and actionable
   - Don't expose internal details or potential security information

3. **Log errors with proper context:**
   - Always include operation context in error logs
   - Log the original error for debugging purposes

4. **Handle validation errors separately:**
   - Return 400 Bad Request for validation errors
   - Include validation details in development mode only

## Advanced Usage

### Including Technical Details in Development

```typescript
const errorResponse = createErrorResponse(error, process.env.NODE_ENV === 'development');
```

### Customizing Error Handling

```typescript
await withErrorHandling(
  async () => { /* operation */ },
  'context',
  (error) => {
    // Custom error handler logic
    analytics.trackError(error);
  }
);
```

## References

- [Next.js API Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [Error Handling Best Practices](https://www.mongodb.com/docs/drivers/node/current/fundamentals/errors/)
