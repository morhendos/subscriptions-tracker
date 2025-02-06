import { MetadataRoute } from 'next'

// This would eventually come from your CMS or database
const BLOG_POSTS = [
  {
    slug: 'how-to-audit-subscriptions',
    lastModified: new Date('2025-02-06'),
  },
  {
    slug: 'subscription-economy-guide',
    lastModified: new Date('2025-02-05'),
  },
  {
    slug: 'family-subscription-tips',
    lastModified: new Date('2025-02-04'),
  },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://subscriptions-tracker.com'

  // Core pages
  const routes = [
    '',
    '/features',
    '/pricing',
    '/blog',
    '/resources',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  // Blog posts
  const blogPosts = BLOG_POSTS.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.lastModified,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [...routes, ...blogPosts]
}