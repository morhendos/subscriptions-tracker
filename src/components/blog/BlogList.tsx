'use client';

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';

const BLOG_POSTS = [
  {
    id: '1',
    title: 'How to Audit Your Subscriptions and Save Money',
    description: 'Learn how to review your subscriptions, identify unnecessary expenses, and optimize your monthly spending.',
    slug: 'how-to-audit-subscriptions',
    date: '2025-02-06'
  },
  {
    id: '2',
    title: 'The Rise of Subscription Economy: What You Need to Know',
    description: 'Understand the subscription-based business model and how it affects your daily life and finances.',
    slug: 'subscription-economy-guide',
    date: '2025-02-05'
  },
  {
    id: '3',
    title: '10 Tips for Managing Family Subscriptions',
    description: 'Practical advice for families looking to organize and optimize their subscription services.',
    slug: 'family-subscription-tips',
    date: '2025-02-04'
  }
];

export function BlogList() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {BLOG_POSTS.map((post) => (
        <Link key={post.id} href={`/blog/${post.slug}`}>
          <Card className="h-full hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>{post.title}</CardTitle>
              <CardDescription>
                <p className="mt-2">{post.description}</p>
                <p className="mt-4 text-sm text-gray-500">{new Date(post.date).toLocaleDateString()}</p>
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}
