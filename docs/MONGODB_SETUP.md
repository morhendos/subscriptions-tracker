# MongoDB Setup Guide

This document provides detailed instructions for setting up, configuring, and troubleshooting MongoDB connections for the Subscriptions Tracker application.

## Table of Contents
- [Configuration Options](#configuration-options)
- [Local Development Setup](#local-development-setup)
- [Production Setup (MongoDB Atlas)](#production-setup-mongodb-atlas)
- [Connection String Format](#connection-string-format)
- [Common Issues and Solutions](#common-issues-and-solutions)
- [Best Practices](#best-practices)
- [Testing Your Connection](#testing-your-connection)

## Configuration Options

The application uses the following environment variables for MongoDB configuration:

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | The connection string to your MongoDB instance | `mongodb://localhost:27017/subscription-tracker` or `mongodb+srv://username:password@cluster.mongodb.net/subscriptions` |
| `MONGODB_DATABASE` | The database name (optional, can be part of URI) | `subscriptions` |
| `NODE_ENV` | Environment setting that determines connection behavior | `development`, `production`, or `test` |

## Local Development Setup

For local development, you'll need to:

1. **Install MongoDB Community Edition**:
   - For macOS: `brew install mongodb-community`
   - For Windows/Linux: [Follow the official installation guide](https://docs.mongodb.com/manual/installation/)

2. **Start the MongoDB service**:
   ```bash
   # Using our scripts
   npm run mongodb:start
   
   # Or directly with brew
   brew services start mongodb-community
   ```

3. **Configure your environment variables**:
   Create a `.env.local` file in the project root with:
   ```
   MONGODB_URI=mongodb://localhost:27017/subscription-tracker
   NODE_ENV=development
   ```

4. **Test your connection**:
   ```bash
   npm run test:connection
   ```

## Production Setup (MongoDB Atlas)

For production environments, we recommend using MongoDB Atlas:

1. **Create a MongoDB Atlas account and cluster**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

2. **Configure your cluster**:
   - Select M10 or higher for production workloads
   - Enable backup (see backup options in `.env.example`)
   - Configure IP allowlist or network peering

3. **Set up database users**: Create a dedicated user with read/write permissions

4. **Configure your environment variables**:
   In your production environment (e.g., Vercel), set:
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/subscriptions?retryWrites=true&w=majority
   NODE_ENV=production
   ```

5. **Important**: Replace `<username>`, `<password>`, `<cluster>` with your actual values

## Connection String Format

The application now has robust handling of MongoDB connection strings. The valid formats are:

### For local development:
```
mongodb://localhost:27017/subscription-tracker
```

### For MongoDB Atlas:
```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/subscriptions?retryWrites=true&w=majority
```

### Key points about the connection string:
- The database name (`subscriptions` or `subscription-tracker`) should be included in the URI
- Query parameters should follow the database name
- The application will automatically normalize URIs with incorrect formats

## Common Issues and Solutions

### Invalid Database Name
If you encounter an error like:
```
Invalid database name: '67a8f19ea78a566fd4d3d0a1_/subscriptions'
```

This indicates an issue with how the database name is being appended to the connection string. Our latest update includes automatic URI normalization to fix this issue.

### Connection Timeouts
If connections are timing out:
- Check network connectivity
- Verify IP allowlist configuration in MongoDB Atlas
- Ensure your cluster is in an appropriate region
- Try increasing the `connectTimeoutMS` value

### Authentication Failures
If you get authentication errors:
- Double-check username and password in connection string
- Verify the user has appropriate permissions
- Ensure the user is associated with the correct database

## Best Practices

1. **Connection Pooling**: The application automatically configures connection pooling based on environment
   - Development: Small pool (5 connections)
   - Production: Larger pool (50 connections)

2. **Error Handling**: The application includes retry logic with exponential backoff

3. **Environment-Specific Settings**: Different database settings are used for development vs. production

4. **Monitoring**: In production, enable all monitoring options in your environment variables

## Testing Your Connection

The application includes several utilities to test your MongoDB connection:

```bash
# Test basic connectivity
npm run test:connection

# Test environment variables
npm run check:env

# Test database operations
npm run test:db

# Test storage provider
npm run test:storage
```

You can also use the `/api/test-user-creation` endpoint to verify user registration is working correctly.

## Additional Resources

- [Official MongoDB Documentation](https://docs.mongodb.com/)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [MongoDB Node.js Driver Documentation](https://mongodb.github.io/node-mongodb-native/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)