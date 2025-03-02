'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

type AnalyticsPageTrackerProps = {
  googleAnalyticsId?: string;
};

/**
 * Component that tracks page views for analytics
 * Must be used within a Suspense boundary since it uses useSearchParams
 * 
 * @param googleAnalyticsId - Google Analytics measurement ID (format: G-XXXXXXXXXX)
 */
export default function AnalyticsPageTracker({
  googleAnalyticsId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
}: AnalyticsPageTrackerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track page views in Google Analytics when the route changes
  useEffect(() => {
    if (googleAnalyticsId && typeof window !== 'undefined' && window.gtag) {
      // Send pageview with the current page URL
      window.gtag('config', googleAnalyticsId, {
        page_path: pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : ''),
      });
    }
  }, [pathname, searchParams, googleAnalyticsId]);

  return null; // This component doesn't render anything visible
}
