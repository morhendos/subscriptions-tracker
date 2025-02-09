# Subscription Tracker

A Next.js web application to help users track and manage their recurring subscriptions.

## Features

- Track subscriptions with different billing periods (monthly and yearly)
- Support for multiple currencies (EUR, USD, GBP, PLN) with automatic conversion
- Calculate total monthly spending across all subscriptions
- Automatic next billing date updates
- Dark mode support
- MongoDB database storage with optimistic concurrency control
- Import/export functionality
- Enable/disable individual or all subscriptions
- Modern UI with slide-out drawers for adding and editing subscriptions

## Tech Stack

- Next.js 14 with App Router
- TypeScript
- MongoDB for data persistence
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
```

## Project Structure

```
src/
├── app/                  # Next.js app router pages
├── components/
│   ├── common/          # Shared components (Section)
│   ├── layout/          # Layout components (PageHeader)
│   ├── settings/        # Settings UI (HeaderControls)
│   ├── ui/              # shadcn/ui components
│   └── subscriptions/   # Subscription-specific components
├── hooks/               # Custom React hooks
├── lib/
│   ├── db/             # MongoDB connection and configuration
│   ├── storage/        # Storage implementation with MongoDB integration
│   └── subscriptions/  # Business logic & utilities
│       ├── config/     # Currency and period configurations
│       └── utils/      # Calculation helpers (dates, currency)
├── models/             # MongoDB models and schemas
├── types/              # TypeScript type definitions
└── utils/              # Helper functions
```

## UI Components

### Section Component
Reusable section component with support for header actions:
```tsx
<Section 
  title="Your Subscriptions"
  action={<Button>Action</Button>}
>
  {/* Content */}
</Section>
```

### AddSubscriptionSheet & EditSubscriptionSheet
Modern slide-out drawer components for managing subscriptions:
```tsx
// Adding new subscriptions
<AddSubscriptionSheet 
  onSubmit={handleSubmit}
  variant="outline"      // default | destructive | outline | secondary | ghost | link
  className="custom-class"
/>

// Editing existing subscriptions
<EditSubscriptionSheet
  subscription={currentSubscription}
  open={isOpen}
  onOpenChange={setIsOpen}
  onSubmit={handleSubmit}
/>
```

## Features Implementation

### Storage
Subscriptions are stored in MongoDB with:
- Optimistic concurrency control for data consistency
- Automatic indexes for common queries
- Type-safe data handling with Mongoose
- User-specific data isolation
- Comprehensive error handling
- Automatic updates of next billing dates

### Next Billing Date Management
The system automatically manages subscription billing dates:
- Updates stale billing dates on application load
- Recalculates next billing date when past due
- Maintains proper chronological order of subscriptions
- Preserves billing dates unless explicitly changed
- Handles both monthly and yearly billing cycles

### Currency Handling
Supports multiple currencies (EUR, USD, GBP, PLN) with:
- Automatic conversion to EUR for calculations
- Configurable exchange rates
- Type-safe currency operations
- Proper decimal handling for each currency

### Subscription Management
- Monthly and yearly billing periods
- Automated next billing date calculation
- Enable/disable functionality
- Batch operations (enable/disable all)
- Summary calculations in base currency (EUR)
- Modern UI with slide-out drawers for adding/editing

### Dark Mode
Implemented using Tailwind's dark mode with class strategy. Theme preference is persisted in localStorage.

### Import/Export
Users can export their subscription data as JSON and import it back, enabling data backup and transfer. The system handles data validation and migration during import.

## Database Schema

### Subscription Model
```typescript
{
  userId: string;          // Indexed for user-specific queries
  name: string;           // Required, trimmed
  price: number;          // Required, min: 0
  currency: Currency;     // Enum: ['USD', 'EUR', 'GBP', 'PLN']
  billingPeriod: Period;  // Enum: ['MONTHLY', 'YEARLY']
  startDate: Date;        // Required
  nextBillingDate: Date;  // Required, auto-calculated
  description?: string;   // Optional
  disabled: boolean;      // Default: false
  createdAt: Date;       // Auto-managed by MongoDB
  updatedAt: Date;       // Auto-managed by MongoDB
}
```

### Indexes
- `userId`: For faster user-specific queries
- Compound: `{ userId: 1, nextBillingDate: 1 }`
- Compound: `{ userId: 1, disabled: 1 }`

## Contributing

1. Create a feature branch from main
2. Make your changes
3. Run type checks and ensure no build errors
4. Submit a PR with a clear description of changes

Note: `main` branch has auto-deployment to production - never push directly to `main`

## Future Improvements

1. Enhanced Features
   - Email notifications for upcoming billing dates
   - More currency options
   - Subscription categories and tags
   - Improved subscription management UI with filters and sorting
   - Bulk actions for subscription management

2. Performance Optimizations
   - Implement cursor-based pagination for large subscription lists
   - Add caching layer for frequently accessed data
   - Optimize MongoDB indexes based on usage patterns

3. Monitoring and Analytics
   - Add MongoDB performance monitoring
   - Implement subscription usage analytics
   - Add error tracking and reporting