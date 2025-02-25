# Subscription Tracker

A Next.js web application to help users track and manage their recurring subscriptions.

## Features

- Track subscriptions with different billing periods (monthly and yearly)
- Support for multiple currencies (EUR, USD, GBP, PLN) with automatic conversion
- Calculate total monthly spending across all subscriptions
- Automatic next billing date updates
- Dark mode support
- MongoDB Atlas integration with production-ready setup
- Database health monitoring and metrics
- API rate limiting and security headers
- Import/export functionality
- Enable/disable individual or all subscriptions
- Modern UI with slide-out drawers for adding and editing subscriptions

## Tech Stack

- Next.js 14 with App Router
- TypeScript
- MongoDB Atlas for production database
- MongoDB local for development
- Tailwind CSS for styling
- Lucide React for icons
- Next-Auth for authentication
- Radix UI components (via shadcn/ui)

## Local Development

### Prerequisites

- MongoDB installed locally
- Node.js 18+ installed

### Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your MongoDB connection string

# Run development server
npm run dev

# Test database connection
npm run test:connection
```

### MongoDB Configuration

The application has robust MongoDB connection handling that:

- Automatically normalizes connection URIs
- Handles various formats of connection strings
- Provides automatic retries with exponential backoff
- Implements environment-specific optimization

For detailed MongoDB setup instructions, see [MongoDB Setup Guide](./docs/MONGODB_SETUP.md).

### Production Setup

The application uses MongoDB Atlas in production. Required environment variables in Vercel:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/subscriptions?retryWrites=true&w=majority
```

Additional MongoDB Atlas configuration:
- Backup enabled with retention policies
- Performance monitoring and alerts
- Connection pool monitoring
- Slow query detection

## Health Monitoring

The application includes a health check endpoint at `/api/healthz` that provides:
- Database connection status
- Connection latency metrics
- Schema validation status
- Available collections

## API Rate Limiting

API endpoints are protected with rate limiting:
- Default: 100 requests per minute
- Configurable per-route limits
- IP-based rate limiting
- Automatic retry mechanism for temporary failures

## Security Features

- Secure headers configuration
- MongoDB connection retry with exponential backoff
- Environment-specific database configurations
- Production-ready security settings

## Troubleshooting

For common issues and their solutions, refer to the [MongoDB Setup Guide](./docs/MONGODB_SETUP.md#common-issues-and-solutions). This includes:

- Connection string format problems
- Authentication issues
- Connection timeouts
- Database name validation errors

## Recent Improvements

- Enhanced MongoDB connection reliability
- Robust URI parsing and normalization
- Improved error handling throughout the application
- Comprehensive documentation for setup and troubleshooting