import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://subscriptions-tracker.com'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/auth/',
        '/login',
        '/signup',
        '/dashboard',
        '/settings',
        '/*.json',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}