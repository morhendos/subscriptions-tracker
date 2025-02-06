import { Metadata } from 'next'
import { Providers } from './providers'
import { baseMetadata } from './metadata'
import { SchemaOrg } from '@/components/SchemaOrg'
import { generateWebsiteSchema, generateOrganizationSchema } from '@/lib/schema'
import './globals.css'

export const metadata: Metadata = baseMetadata

const websiteSchema = generateWebsiteSchema({
  name: 'Subscription Tracker',
  description: 'Track and manage all your subscriptions in one place.',
  organization: {
    name: 'Subscription Tracker',
    url: 'https://subscriptions-tracker.com',
    logo: 'https://subscriptions-tracker.com/logo.png',
    sameAs: [
      'https://twitter.com/substracker',
      'https://facebook.com/substracker',
      'https://linkedin.com/company/substracker'
    ]
  }
})

const organizationSchema = generateOrganizationSchema({
  name: 'Subscription Tracker',
  url: 'https://subscriptions-tracker.com',
  logo: 'https://subscriptions-tracker.com/logo.png',
  sameAs: [
    'https://twitter.com/substracker',
    'https://facebook.com/substracker',
    'https://linkedin.com/company/substracker'
  ]
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <SchemaOrg schema={websiteSchema} />
        <SchemaOrg schema={organizationSchema} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        {/* Add preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}