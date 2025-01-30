# Subscription Tracker

A Next.js web application to help users track and manage their recurring subscriptions.

## Features

- Track subscriptions with different billing periods (weekly, monthly, quarterly, yearly)
- Support for multiple currencies (EUR, USD, PLN) with automatic conversion
- Calculate total monthly spending across all subscriptions
- Dark mode support
- Local storage persistence
- Import/export functionality

## Tech Stack

- Next.js 14 with App Router
- TypeScript
- Tailwind CSS for styling
- Lucide React for icons

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
├── lib/                 # Business logic & utilities
├── types/               # TypeScript type definitions
└── utils/               # Helper functions
```

## Features Implementation

### Storage
Subscriptions are stored in localStorage with automatic currency conversion for the summary view. Data persistence is handled through the `useLocalStorage` hook.

### Currency Conversion
All non-EUR currencies are converted to EUR for total calculations using fixed rates defined in the format utilities.

### Dark Mode
Implemented using Tailwind's dark mode with class strategy. Theme preference is persisted in localStorage.

### Import/Export
Users can export their subscription data as JSON and import it back, enabling data backup and transfer.

## Contributing

1. Create a feature branch from main
2. Make your changes
3. Submit a PR with a clear description of changes

Note: `main` branch has auto-deployment to production - never push directly to `main`