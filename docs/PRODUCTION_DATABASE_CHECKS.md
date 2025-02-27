# Production Database Checks

This document explains how to safely run database diagnostic tools in production environments.

## Running Database Diagnostics in Production

When facing authentication or database issues in production, it's useful to run diagnostic tools to identify the problem. Here's how to safely run the database info script in production:

### Method 1: Local Connection to Production Database

The safest way to diagnose production database issues is to run the script locally while connecting to your production database:

1. **Create a temporary `.env.production` file locally:**

   ```
   MONGODB_URI=mongodb+srv://username:password@your-production-cluster.mongodb.net/
   ```

2. **Run the diagnostic script with the production environment:**

   ```bash
   DOTENV_CONFIG_PATH=.env.production node -r dotenv/config scripts/test-db-info.js
   ```

3. **Remove the temporary file when done:**

   ```bash
   rm .env.production
   ```

This approach allows you to diagnose the database connection without deploying any code to production.

### Method 2: Temporary Deployment to Production

If you need to run the diagnostics directly in the production environment:

1. **Create a temporary deployment branch:**

   ```bash
   git checkout -b temp/db-diagnostics
   ```

2. **Deploy only the diagnostic script to production:**

   ```bash
   git push <production-remote> temp/db-diagnostics
   ```

3. **SSH into the production server and run:**

   ```bash
   npm run test:db-info
   ```

4. **Remove the temporary branch when done:**

   ```bash
   git push <production-remote> --delete temp/db-diagnostics
   ```

### Method 3: One-Time Script in Vercel

If using Vercel for hosting:

1. Go to the Vercel dashboard for your project
2. Navigate to Settings > Functions > Console
3. Run the following command:

   ```bash
   node scripts/test-db-info.js
   ```

## Interpreting the Results

The diagnostic script will output:

1. The original MongoDB URI (with credentials masked)
2. The normalized URI with the correct database name
3. The database name it's actually connecting to
4. Available collections in the database
5. Whether the users collection exists
6. How many users are in the database

Example output:

```
----- MongoDB Connection Test With Database Info -----
Original URI: mongodb+srv://****:****@cluster0.mongodb.net/test
Normalized URI: mongodb+srv://****:****@cluster0.mongodb.net/subscriptions
Target database name: subscriptions

Connecting to MongoDB...
Connection successful!
Connected to database: subscriptions

✅ Connected to the correct database: subscriptions

Available collections:
  - users
  - subscriptions

✅ Found users collection

There are 15 users in the database.

Disconnected from MongoDB.
----- Test Complete -----
```

## Fixing Database Issues

If the script shows you're connecting to the wrong database, you have two options:

1. **Update your MongoDB URI** to explicitly include the correct database name:

   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/subscriptions
   ```

2. **Deploy the full fix** from PR #50, which includes automatic normalization of database names.

## Security Considerations

- Never commit production database credentials to your repository
- Delete any temporary files containing credentials after use
- Use the masked URI in logs to avoid exposing sensitive information
- Run diagnostics only when needed and remove temporary diagnostic deployments promptly
