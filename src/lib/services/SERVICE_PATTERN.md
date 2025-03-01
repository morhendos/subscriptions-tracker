# Service Function Pattern

This document describes the recommended pattern for implementing service functions in the Subscription Tracker application.

## What are Service Functions?

Service functions are pure JavaScript/TypeScript functions that encapsulate business logic and data access operations. They provide a clean separation between the API layer (HTTP routes) and the data layer (database queries).

## Why Use Service Functions?

- **Separation of Concerns**: Keeps business logic separate from HTTP handling
- **Reusability**: Functions can be used across different parts of the application
- **Testability**: Makes unit testing easier with clearly defined inputs and outputs
- **Consistency**: Establishes a standard pattern for handling similar operations

## Service Function Structure

### Basic Pattern

```typescript
// src/lib/services/subscription-service.ts

import { withConnection } from '@/lib/db/simplified-connection';
import { withErrorHandling } from '@/lib/db/unified-error-handler';
import { SubscriptionModel } from '@/models/subscription';
import { Subscription, SubscriptionFormData } from '@/types/subscriptions';

/**
 * Get all subscriptions for a user
 */
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

/**
 * Create a new subscription for a user
 */
export async function createSubscription(
  userId: string, 
  data: SubscriptionFormData
): Promise<Subscription> {
  return withErrorHandling(async () => {
    return withConnection(async () => {
      const subscription = await SubscriptionModel.create({
        userId,
        ...data,
        nextBillingDate: calculateNextBillingDate(data.startDate, data.billingPeriod)
      });

      return formatSubscription(subscription);
    });
  }, 'createSubscription');
}

// Helper function to format subscription data consistently
function formatSubscription(subscription: any): Subscription {
  return {
    id: subscription._id.toString(),
    name: subscription.name,
    price: subscription.price,
    // ... other fields
  };
}
```

### Usage in API Routes

```typescript
// src/app/api/subscriptions/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createErrorResponse } from '@/lib/db/unified-error-handler';
import { MongoDBErrorCode } from '@/lib/db/error-handler';
import { getUserSubscriptions } from '@/lib/services/subscription-service';

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

    const subscriptions = await getUserSubscriptions(session.user.id);
    return NextResponse.json(subscriptions);
  } catch (error: unknown) {
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

1. **Function Naming**:
   - Use descriptive verb-noun pairs: `getUserSubscriptions`, `createSubscription`
   - Avoid generic names like `getData` or `processItem`

2. **Error Handling**:
   - Always use `withErrorHandling` to ensure consistent error handling
   - Let errors propagate to the API layer for proper status code assignment

3. **Database Access**:
   - Use `withConnection` for all database operations
   - Use lean queries when possible for better performance
   - Isolate database-specific code within service functions

4. **Formatting**:
   - Create helper functions for consistent data formatting
   - Keep transformations (like IDs and dates) within service layer

5. **Single Responsibility**:
   - Each service function should do one thing well
   - Break complex operations into smaller functions

6. **Documentation**:
   - Add JSDoc comments for parameters and return values
   - Document any side effects or important behaviors

## Organization

### By Feature

Organize service functions by feature area:

```
src/lib/services/
  ├── subscription-service.ts
  ├── user-service.ts
  ├── billing-service.ts
  └── notification-service.ts
```

### By Operation Type

For larger features, you can further organize by operation type:

```
src/lib/services/subscriptions/
  ├── queries.ts      // All read operations
  ├── commands.ts     // All write operations
  ├── calculations.ts // Business logic calculations
  └── helpers.ts      // Shared helper functions
```

## Testing

```typescript
// src/lib/services/__tests__/subscription-service.test.ts

import { getUserSubscriptions } from '../subscription-service';
import { SubscriptionModel } from '@/models/subscription';
import mongoose from 'mongoose';

// Mock the Mongoose model
jest.mock('@/models/subscription');

describe('Subscription Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserSubscriptions', () => {
    it('should return formatted subscriptions for a user', async () => {
      // Arrange
      const mockSubscriptions = [
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'Netflix',
          price: 9.99,
          // ... other fields
        }
      ];
      
      // Setup mock
      (SubscriptionModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockSubscriptions)
          })
        })
      });
      
      // Act
      const result = await getUserSubscriptions('user-123');
      
      // Assert
      expect(SubscriptionModel.find).toHaveBeenCalledWith({ userId: 'user-123' });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockSubscriptions[0]._id.toString());
      expect(result[0].name).toBe('Netflix');
    });
  });
});
```

## Migrating Existing Code

When migrating existing code to this pattern:

1. Identify business logic in API routes
2. Extract into service functions
3. Update API routes to use service functions
4. Add unit tests for service functions
5. Ensure error handling is consistent

## Conclusion

Service functions provide a clean and maintainable way to organize business logic and data access. By following these patterns, we can improve code quality, testability, and maintainability without introducing unnecessary complexity.
