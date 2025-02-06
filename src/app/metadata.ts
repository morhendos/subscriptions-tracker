import { Metadata } from 'next'

export const baseMetadata: Metadata = {
  title: {
    default: 'Subscription Tracker - Manage Your Subscriptions Easily',
    template: '%s | Subscription Tracker'
  },
  description: 'Track and manage all your subscriptions in one place. Save money, avoid unexpected charges, and get insights into your subscription spending.',
  keywords: ['subscription tracker', 'subscription management', 'recurring payments', 'expense tracking', 'budget management'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://subscriptions-tracker.com',
    siteName: 'Subscription Tracker',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Subscription Tracker'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Subscription Tracker - Manage Your Subscriptions Easily',
    description: 'Track and manage all your subscriptions in one place.',
    images: ['/twitter-image.png']
  },
  alternates: {
    canonical: 'https://subscriptions-tracker.com'
  }
}