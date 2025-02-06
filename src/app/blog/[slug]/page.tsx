import { Metadata } from 'next'
import { notFound } from 'next/navigation'

// This would eventually come from a CMS or database
const BLOG_POSTS = {
  'how-to-audit-subscriptions': {
    title: 'How to Audit Your Subscriptions and Save Money',
    description: 'Learn how to review your subscriptions, identify unnecessary expenses, and optimize your monthly spending.',
    content: `
      <article class="prose dark:prose-invert lg:prose-xl max-w-none">
        <h1>How to Audit Your Subscriptions and Save Money</h1>
        
        <p>In today's digital age, subscriptions have become an integral part of our lives. From streaming services to software tools, these recurring payments can quickly add up. This comprehensive guide will help you audit your subscriptions and identify potential savings.</p>

        <h2>Why Audit Your Subscriptions?</h2>
        <p>Regular subscription audits can help you:</p>
        <ul>
          <li>Identify forgotten or unused subscriptions</li>
          <li>Optimize your spending</li>
          <li>Better understand your monthly expenses</li>
          <li>Make informed decisions about your subscriptions</li>
        </ul>

        <h2>Step-by-Step Audit Process</h2>
        <h3>1. Gather All Your Subscriptions</h3>
        <p>Start by listing all your active subscriptions. Check your:</p>
        <ul>
          <li>Credit card statements</li>
          <li>Email receipts</li>
          <li>App store subscriptions</li>
          <li>Banking transactions</li>
        </ul>

        <h3>2. Evaluate Usage</h3>
        <p>For each subscription, ask yourself:</p>
        <ul>
          <li>How often do I use this service?</li>
          <li>Does it provide value for money?</li>
          <li>Are there better alternatives?</li>
          <li>Could I share this subscription with family members?</li>
        </ul>

        <h2>Tools to Help You Track</h2>
        <p>Using a subscription tracker can make this process much easier. Our platform helps you:</p>
        <ul>
          <li>Automatically track all your subscriptions</li>
          <li>Set up renewal reminders</li>
          <li>Visualize your spending patterns</li>
          <li>Make data-driven decisions</li>
        </ul>

        <h2>Next Steps</h2>
        <p>Ready to start your subscription audit? Sign up for our free subscription tracking tool and take control of your recurring expenses today.</p>
      </article>
    `
  }
  // Add more blog posts here
}

type Props = {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = BLOG_POSTS[params.slug as keyof typeof BLOG_POSTS]
  
  if (!post) {
    return {
      title: 'Not Found',
      description: 'The page you are looking for does not exist.'
    }
  }

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: '2025-02-06T00:00:00.000Z',
      authors: ['Subscription Tracker Team']
    }
  }
}

export default function BlogPost({ params }: Props) {
  const post = BLOG_POSTS[params.slug as keyof typeof BLOG_POSTS]

  if (!post) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div 
        className="mt-6"
        dangerouslySetInnerHTML={{ __html: post.content }} 
      />
    </div>
  )
}