# Subscription Tracker

A Next.js web application to help users track and manage their recurring subscriptions.

## Features

- Track subscriptions with different billing periods (monthly and yearly)
- Support for multiple currencies (EUR, USD, GBP, PLN) with automatic conversion
- Calculate total monthly spending across all subscriptions
- Dark mode support
- Persistent local storage with automatic data migration
- Import/export functionality
- Enable/disable individual or all subscriptions

## Tech Stack

- Next.js 14 with App Router
- TypeScript
- Tailwind CSS for styling
- Lucide React for icons
- Next-Auth for authentication

## Local Development

```bash
# Install dependencies
npm install

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
│   └── subscriptions/   # Subscription-specific components
├── hooks/               # Custom React hooks
├── lib/
│   ├── storage/         # Storage implementation with abstraction
│   └── subscriptions/   # Business logic & utilities
│       ├── config/      # Currency and period configurations
│       └── utils/       # Calculation helpers
├── types/               # TypeScript type definitions
└── utils/               # Helper functions
```

## Features Implementation

### Storage
Subscriptions are stored using a flexible storage provider interface, currently implemented with localStorage. The storage system includes:
- Automatic data migration for billing period formats
- Type-safe data handling
- User-specific storage isolation
- Error handling and fallbacks

### Currency Handling
Supports multiple currencies (EUR, USD, GBP, PLN) with:
- Automatic conversion to EUR for calculations
- Configurable exchange rates
- Type-safe currency operations
- Proper decimal handling for each currency

### Subscription Management
- Monthly and yearly billing periods
- Next billing date calculation
- Enable/disable functionality
- Batch operations (enable/disable all)
- Summary calculations in base currency (EUR)

### Dark Mode
Implemented using Tailwind's dark mode with class strategy. Theme preference is persisted in localStorage.

### Import/Export
Users can export their subscription data as JSON and import it back, enabling data backup and transfer. The system handles data validation and migration during import.

## Contributing

1. Create a feature branch from main
2. Make your changes
3. Run type checks and ensure no build errors
4. Submit a PR with a clear description of changes

Note: `main` branch has auto-deployment to production - never push directly to `main`

## Future Improvements

1. Database Integration
   - The storage system is designed with a provider interface, making it easy to add database support in the future
   - Current localStorage implementation can serve as a fallback

2. Additional Features
   - Email notifications for upcoming billing dates
   - More currency options
   - Subscription categories and tags