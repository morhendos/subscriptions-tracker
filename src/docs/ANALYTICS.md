# Analytics Implementation

This document explains how analytics is implemented in the Subscriptions Tracker application.

## Overview

The analytics implementation follows Next.js best practices, separating script loading from client-side tracking to ensure proper server-side rendering and optimal performance.

## Components

### 1. `Analytics.tsx`

- Handles loading of analytics scripts (Google Analytics, Microsoft Clarity)
- Placed in the `<head>` section for optimal loading
- Doesn't use any client-side hooks, making it safe for server components

### 2. `AnalyticsPageTracker.tsx`

- Handles page view tracking using client-side hooks (`usePathname`, `useSearchParams`)
- Must be wrapped in a Suspense boundary
- Placed in the `<body>` section to avoid hydration issues

## Implementation

The components are integrated in the root layout (`src/app/layout.tsx`):

```tsx
// In the <head> section
<Analytics 
  googleAnalyticsId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}
  microsoftClarityId={process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID}
/>

// In the <body> section
<Suspense fallback={null}>
  <AnalyticsPageTracker 
    googleAnalyticsId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}
  />
</Suspense>
```

## Environment Variables

To use analytics, you need to set the following environment variables:

```
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_CLARITY_PROJECT_ID=xxxxxxxxxx
```

## Best Practices

1. **Always wrap components using `useSearchParams()` in Suspense**:
   ```tsx
   <Suspense fallback={null}>
     <ComponentUsingSearchParams />
   </Suspense>
   ```

2. **Keep analytics scripts and page tracking separate**:
   - Scripts go in the head
   - Page tracking goes in the body

3. **Use environment variables for configuration**:
   - This allows for different configurations in development, staging, and production

## Extending Analytics

To add additional analytics providers:

1. Add the provider's script to `Analytics.tsx`
2. Configure any page tracking in `AnalyticsPageTracker.tsx`
3. Update environment variables as needed

## Testing

To test analytics locally:

1. Add the environment variables to your `.env.local` file
2. Open browser developer tools and look for:
   - Google Analytics: Network requests to `www.google-analytics.com`
   - Microsoft Clarity: Network requests to `www.clarity.ms`
