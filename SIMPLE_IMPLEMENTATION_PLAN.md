# Simple Implementation Plan

## Update All API Routes to Use Service Functions

### 1. Subscription Endpoints

Update these endpoints to use the subscription service:

| API Route | Method | Service Function |
|-----------|--------|------------------|
| `/api/subscriptions` | GET | `getUserSubscriptions()` |
| `/api/subscriptions` | POST | `createSubscription()` |
| `/api/subscriptions/[id]` | GET | `getSubscriptionById()` |
| `/api/subscriptions/[id]` | PUT | `updateSubscription()` |
| `/api/subscriptions/[id]` | DELETE | `deleteSubscription()` |

### 2. Storage Endpoints

Create a storage service with these functions and update the routes:

| API Route | Method | Service Function to Create |
|-----------|--------|---------------------------|
| `/api/storage` | GET | `getStorageItem()` |
| `/api/storage` | POST | `saveStorageItem()` |
| `/api/storage` | DELETE | `deleteStorageItem()` |

### 3. Health Check Endpoints

Create a health service with these functions:

| API Route | Method | Service Function to Create |
|-----------|--------|---------------------------|
| `/api/health/db` | GET | `getDatabaseHealth()` |
| `/api/healthz` | GET | `getSystemHealth()` |

### 4. Auth Debug Endpoints (if maintaining them)

Create auth debug service:

| API Route | Method | Service Function to Create |
|-----------|--------|---------------------------|
| `/api/auth-debug/create-test-user` | POST | `createTestUser()` |
| `/api/check-environment` | GET | `checkEnvironment()` |

## Implementation Steps

1. **Use existing subscription service** - Already implemented
2. **Create storage service** - Move database logic from API routes
3. **Create health service** - Move health check logic
4. **Create auth debug service** - If these endpoints will be maintained
5. **Update all API routes** - Replace direct database calls with service function calls

## Implementation Approach

For each API route:

1. **Leave HTTP, auth, and error handling alone** - Keep in API routes
2. **Move data access to service functions** - Everything that touches the database  
3. **Replace database calls with service calls** - Simple substitution

That's it! Keep it practical and straightforward.

## Verification

Start the app and check that all functionality works as before:
1. Login/signup
2. View subscriptions
3. Create/edit/delete subscriptions

All existing behavior should remain the same.
