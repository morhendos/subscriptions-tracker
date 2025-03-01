# Service Function Implementation Guide

This document provides a step-by-step guide for implementing the service function pattern throughout the Subscription Tracker application.

## Implementation Roadmap

### Phase 1: Review and Preparation (1 day)

1. **Review Documentation**
   - Review [SERVICE_PATTERN.md](./src/lib/services/SERVICE_PATTERN.md) to understand the pattern
   - Examine the example implementation in [src/lib/services/subscription-service.ts](./src/lib/services/subscription-service.ts)
   - Look at the refactored API route example in [REFACTORED_EXAMPLE.md](./src/app/api/subscriptions/REFACTORED_EXAMPLE.md)

2. **Set Up Testing Environment**
   - Ensure your local environment can run tests
   - Run existing tests to confirm they pass before making changes
   - Create a test branch for your first implementation

### Phase 2: Implement Core Services (2-3 days)

Start with implementing service functions for the core features:

1. **Subscription Service** (Complete)
   - ✅ getUserSubscriptions
   - ✅ getSubscriptionById
   - ✅ createSubscription
   - ✅ updateSubscription
   - ✅ deleteSubscription

2. **User Service** (To Be Implemented)
   - Create a new file: `src/lib/services/user-service.ts`
   - Implement functions for user management
   - Add appropriate tests

3. **Authentication Service** (To Be Implemented)
   - Create a new file: `src/lib/services/auth-service.ts`
   - Migrate from existing auth actions if possible
   - Add appropriate tests

### Phase 3: Refactor API Routes (3-4 days)

Refactor API routes in the following order:

1. **Begin with Simple GET Endpoints**
   - `/api/health/db` - A simple health check endpoint
   - `/api/subscriptions` (GET) - List subscriptions

2. **Move to Single-Resource Endpoints**
   - `/api/subscriptions/[id]` (GET) - Get a single subscription
   - `/api/subscriptions/[id]` (DELETE) - Delete a subscription

3. **Complete with POST/PUT Endpoints**
   - `/api/subscriptions` (POST) - Create a subscription
   - `/api/subscriptions/[id]` (PUT) - Update a subscription
   - `/api/storage` - All methods

4. **Update Documentation**
   - Update README with the new architecture
   - Update any API documentation

### Phase 4: Testing and Cleanup (2 days)

1. **Testing**
   - Run all tests to ensure functionality works as expected
   - Add any missing tests
   - Test in development environment

2. **Cleanup**
   - Remove duplicate code
   - Refactor any remaining direct database calls
   - Ensure consistent error handling

## API Route Refactoring Checklist

For each API route you refactor, follow this checklist:

1. **Identify Data Access**
   - Find all database operations in the route
   - Note any business logic that should be moved to services

2. **Create/Update Service Functions**
   - Create or update appropriate service functions
   - Add comprehensive tests for each function

3. **Update API Route**
   - Replace direct database calls with service function calls
   - Keep validation and auth checks in the API layer
   - Maintain consistent error handling

4. **Test Thoroughly**
   - Test success paths
   - Test error paths
   - Verify proper status codes and response formats

5. **Update Documentation**
   - Add JSDoc comments
   - Update any API documentation

## Implementation Example: Refactoring an API Route

Here's the process for refactoring a single API route:

### 1. Original API Route

First, identify the database operations and business logic:

```typescript
// Before refactoring
export async function GET() {
  try {
    return await withErrorHandling(async () => {
      const session = await getServerSession();

      if (!session?.user?.id) {
        return new NextResponse(
          JSON.stringify({ 
            error: 'Authentication required',
            code: 'auth.unauthorized'
          }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Database operation to move to service
      const subscriptions = await SubscriptionModel.find({ userId: session.user.id })
        .sort({ nextBillingDate: 1 })
        .lean()
        .exec();

      // Data transformation to move to service
      const result = subscriptions.map((sub) => ({
        id: sub._id.toString(),
        name: sub.name,
        // ... other fields
      }));

      return NextResponse.json(result);
    }, 'api/subscriptions/GET');
  } catch (error: unknown) {
    // Error handling stays in API layer
    console.error('GET /api/subscriptions error:', error);
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

### 2. Create Service Function

Move database operations and business logic to a service function:

```typescript
// src/lib/services/subscription-service.ts
export async function getUserSubscriptions(userId: string): Promise<Subscription[]> {
  return withErrorHandling(async () => {
    return withConnection(async () => {
      const subscriptions = await SubscriptionModel.find({ userId })
        .sort({ nextBillingDate: 1 })
        .lean()
        .exec();
      
      return subscriptions.map(formatSubscription);
    });
  }, 'getUserSubscriptions');
}

// Helper function for consistent formatting
function formatSubscription(doc: any): Subscription {
  return {
    id: doc._id.toString(),
    name: doc.name,
    // ... other fields
  };
}
```

### 3. Refactored API Route

Update the API route to use the service function:

```typescript
// After refactoring
export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Authentication required',
          code: 'auth.unauthorized'
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Use the service function
    const subscriptions = await getUserSubscriptions(session.user.id);
    return NextResponse.json(subscriptions);
  } catch (error: unknown) {
    // Error handling stays in API layer
    console.error('GET /api/subscriptions error:', error);
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

## Best Practices

1. **One Change at a Time**
   - Refactor one endpoint at a time
   - Test thoroughly after each refactoring
   - Commit incrementally with clear messages

2. **Consistent Naming**
   - Use descriptive verb-noun pairs for function names
   - Follow established naming conventions

3. **Error Handling**
   - Keep error handling consistent across all endpoints
   - Use the standardized error responses

4. **Testing**
   - Write unit tests for all service functions
   - Test both success and error paths

5. **Documentation**
   - Document all service functions with JSDoc comments
   - Keep API documentation up to date

## Conclusion

By following this implementation guide, you'll successfully refactor the Subscription Tracker application to use the service function pattern. This will improve code organization, reusability, and maintainability without introducing unnecessary complexity.

If you encounter any issues during implementation, refer to the [SERVICE_PATTERN.md](./src/lib/services/SERVICE_PATTERN.md) documentation for guidance or consult with the team.
