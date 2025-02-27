# Authentication Fix Documentation

## Problem

Users were unable to log in on production, receiving 401 Unauthorized errors from the credentials endpoint. The root cause was identified as a database naming issue - users in production were stored in the "subscriptions" database, but the MongoDB connection was defaulting to the "test" database.

## Root Causes

1. **Database Name Mismatch**: The MongoDB connection was using the wrong database name ("test" instead of "subscriptions").

2. **Connection URI Handling**: The MongoDB URI wasn't properly normalized to ensure it always used the correct database name.

3. **Environment Variables**: Different environments had different database naming conventions, causing inconsistency between development and production.

## Solution

### 1. URI Normalization

We implemented a robust URI normalization function that ensures the application always connects to the "subscriptions" database:

```javascript
function normalizeMongoUri(uri) {
  // If the URI already includes 'subscriptions', don't modify it
  if (uri.includes('/subscriptions')) {
    return uri;
  }
  
  // Check if URI has a database segment
  const uriParts = uri.split('/');
  
  // If the URI has a database name specified (after the last slash)
  if (uriParts.length > 3) {
    // Get the base URI without the database name
    const baseUri = uriParts.slice(0, -1).join('/');
    // Ensure we use the 'subscriptions' database
    return `${baseUri}/subscriptions`;
  }
  
  // If no database is specified, append 'subscriptions'
  return `${uri}/subscriptions`;
}
```

### 2. Dedicated Authentication Connection Manager

We created a specialized connection manager for authentication operations in `src/lib/db/auth-connection.ts`. This manager:

- Uses the normalized URI to ensure consistent database selection
- Provides detailed logging for troubleshooting
- Maintains a persistent connection specifically for auth operations

### 3. Updated Connection Managers

All connection managers (`simplified-connection.ts` and `auth-connection.ts`) now use the URI normalization function to ensure they connect to the correct database.

### 4. Debugging Tools

We added specialized tools to diagnose database connection issues:

- A new API route at `/api/auth-debug` that shows database connection status
- A script at `scripts/test-db-info.js` that provides detailed information about database connections
- Enhanced environment variable checker that verifies database names

## Verifying the Fix

### How to Test

1. **Run the Database Info Script**:
   ```bash
   npm run test:db-info
   ```
   This will show if the connection is using the correct database.

2. **Check Environment Variables**:
   ```bash
   npm run check:env
   ```
   This will verify if your MongoDB URI has the correct database name.

3. **Use the Auth Debug Endpoint** (In Development):
   Visit `/api/auth-debug` in your browser to see authentication status and database information.

### Expected Results

- The database connection should use the "subscriptions" database, not "test"
- Users should be able to log in successfully
- No 401 Unauthorized errors from the credentials endpoint

## Production Configuration

For production deployments, ensure your MongoDB URI is properly configured. You can either:

1. **Explicitly include the database name** in your URI:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/subscriptions?retryWrites=true&w=majority
   ```

2. **Rely on our normalization** which will ensure the correct database is used even if not specified in the URI:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
   ```

## Troubleshooting

If login issues persist after deploying these fixes:

1. **Check Database Connection**: Run the database info script to verify the connection is using the correct database.

2. **Verify User Collection**: Make sure the "users" collection exists in the "subscriptions" database and contains user records.

3. **Enable Debug Endpoint Temporarily**: Set `ALLOW_AUTH_DEBUG=true` in your environment variables to enable the auth debug endpoint in production (remember to disable after troubleshooting).

4. **Check Logs**: Look for errors or warnings in the server logs related to MongoDB connections or authentication.

## Security Considerations

- The auth debug endpoint is disabled in production by default
- Set `ALLOW_AUTH_DEBUG=true` only temporarily for troubleshooting
- User data is sanitized when debug information is returned
