# Authentication Debug Tools

This directory contains debug tools for authentication and database inspection.

## Security Warning

These tools are intended for development and debugging purposes only. In production, they are disabled by default for security reasons.

## Enabling Debug Tools in Production

If you need to use these tools in a production environment (for example, to create a test user or diagnose authentication issues), you can temporarily enable them by setting the following environment variable:

```
ALLOW_AUTH_DEBUG=true
```

### Vercel Deployment

If you're using Vercel, you can set this environment variable in the project settings:

1. Go to your Vercel dashboard
2. Select the project
3. Navigate to "Settings" → "Environment Variables"
4. Add a new variable with key `ALLOW_AUTH_DEBUG` and value `true`
5. Deploy or redeploy your application

### Docker Deployment

If you're using Docker, set the environment variable in your docker-compose file or when running the container:

```yaml
# docker-compose.yml
services:
  app:
    image: subscriptions-tracker
    environment:
      - ALLOW_AUTH_DEBUG=true
```

Or with the docker run command:

```bash
docker run -e ALLOW_AUTH_DEBUG=true subscriptions-tracker
```

## Security Best Practices

When working with these debug tools:

1. **Only enable temporarily**: Set the environment variable, perform your debugging, then remove it immediately.
2. **Restrict access**: If possible, use IP restrictions or basic auth to control who can access these endpoints.
3. **Monitor usage**: Keep track of when these tools are enabled in production.
4. **Never enable on public-facing production**: If you must use in production, do so on a staging or internal environment.

## Available Tools

- **Create Test User**: Create a user account for testing purposes
- **MongoDB Connection Test**: Verify the connection to the database
- **Authentication Test**: Test login functionality directly

## Troubleshooting

If you see the error "This endpoint is only available in development mode", it means you're trying to use these tools in production without setting `ALLOW_AUTH_DEBUG=true`.
