import { Metadata } from 'next'
import { BlogList } from '@/components/blog/BlogList'

export const metadata: Metadata = {
  title: 'Subscription Management Blog - Tips, Guides & Insights',
  description: 'Learn about subscription management, cost optimization, and personal finance. Get expert tips on tracking and managing your recurring payments.',
}

export default function BlogPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Subscription Management Blog</h1>
      <p className="text-xl mb-8 text-gray-600 dark:text-gray-300">
        Expert advice on managing subscriptions, reducing costs, and optimizing your recurring payments.
      </p>
      <BlogList />
    </div>
  )
}
