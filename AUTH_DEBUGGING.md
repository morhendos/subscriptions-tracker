# Authentication Debugging Guide

This guide helps diagnose and fix authentication issues in the Subscriptions Tracker application.

## Using the Auth Debug Tool

I've created a special debug tool you can use to identify the exact cause of your login issues. Follow these steps:

1. Start your development server as normal:
   ```
   npm run dev
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:3000/auth-debug
   ```

3. This debug page provides three main functions:
   - Test MongoDB connection
   - Create a test user
   - Test authentication

## Step 1: Test MongoDB Connection

First, click "Test MongoDB Connection" to verify that:
- Your MongoDB server is running
- The application can connect to the database
- The database structure is correct

Check your server console for detailed output. Look for:
- The connection string being used
- Any connection errors
- The database collections available
- Whether there are any users in the database

## Step 2: Create a Test User

If the connection test succeeds but there are no users, or if you're unsure about existing user credentials:

1. Fill in the "Create Test User" form with:
   - Email: Choose a simple email like `test@example.com`
   - Name: (optional)
   - Password: Choose a simple password like `password123`

2. Click "Create Test User" to add this user to the database

3. Check the results to confirm the user was created successfully

## Step 3: Test Authentication

Now test if authentication works with your new user:

1. Fill in the "Authentication Test" form with the same credentials you used to create the test user
2. Click "Test Authentication"
3. Check both the on-screen results and your server console logs

The authentication test will show you each step of the process and where exactly it fails.

## Common Issues and Solutions

### No MongoDB Connection

**Symptoms:**
- "MongoDB connection failed" error
- No database collections found

**Solutions:**
1. Make sure MongoDB is running on your machine
2. Check your `.env.local` file has the correct MongoDB URI
   ```
   MONGODB_URI=mongodb://localhost:27017/subscriptions
   ```
3. If using a remote MongoDB, verify your network connection

### User Collection Issues

**Symptoms:**
- MongoDB connects but "no users found" or "user collection missing"

**Solutions:**
1. Use the "Create Test User" feature to add a user
2. Check if your database name is correct

### Password Validation Failures

**Symptoms:**
- "Invalid password" or "Password check error" during authentication
- Authentication fails despite user existing

**Solutions:**
1. Create a new test user with a simple password
2. Check if bcrypt is properly comparing passwords
3. If you see hashing errors, there might be an issue with the password storage format

### NextAuth Configuration Issues

**Symptoms:**
- Authentication test passes but the login page still fails
- You get a 401 Unauthorized error

**Solutions:**
1. Verify that NextAuth environment variables are set correctly:
   ```
   NEXTAUTH_SECRET=your_secret_key
   NEXTAUTH_URL=http://localhost:3000
   ```
2. Check the NextAuth.js logs for error details
3. Ensure the credential provider is properly configured

## Advanced Diagnostics

If you need more detailed information, check these locations:

1. Server logs during authentication for the full execution path
2. Check the browser's Network tab when attempting login
3. Look for the `/api/auth/callback/credentials` request and examine its response
4. Try clearing browser cookies and local storage to eliminate cached auth data

## Database Inspection

If you need to manually inspect the database:

```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/subscriptions

# List collections
show collections

# Check users collection
db.users.find().pretty()

# Count users
db.users.countDocuments()
```

## If All Else Fails

If you've tried everything and still have issues:

1. Create a completely new user with the debug tool
2. Use the diagnostic output to identify any unexpected differences in how the authentication system works
3. Consider resetting your database completely:
   ```
   mongosh mongodb://localhost:27017/subscriptions
   db.dropDatabase()
   ```
   Then create a new test user with the debug tool

## Development vs Production

Remember that this debugging tool is only available in development mode as a safety measure. The solutions you find should work in both environments, but be sure to test thoroughly.