import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';
import Providers from './providers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import GradientBackground from '@/components/GradientBackground';
import Analytics from '@/components/Analytics';
import AnalyticsPageTracker from '@/components/AnalyticsPageTracker';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Subscription Tracker',
  description: 'Track your subscriptions and recurring payments',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Analytics Scripts - these don't use client hooks so they're safe in head */}
        <Analytics 
          googleAnalyticsId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}
          microsoftClarityId={process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID}
        />
      </head>
      <body className={`${inter.className} min-h-screen bg-background text-foreground relative`}>
        {/* Suspense boundary for client component that uses useSearchParams */}
        <Suspense fallback={null}>
          <AnalyticsPageTracker 
            googleAnalyticsId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}
          />
        </Suspense>

        <Providers session={session}>
          <GradientBackground />
          {children}
        </Providers>
      </body>
    </html>
  );
}
