interface Organization {
  name: string;
  url: string;
  logo: string;
  sameAs: string[];
}

interface WebsiteData {
  name: string;
  description: string;
  organization: Organization;
}

export function generateWebsiteSchema(data: WebsiteData) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: data.name,
    description: data.description,
    url: data.organization.url,
    publisher: {
      '@type': 'Organization',
      name: data.organization.name,
      logo: {
        '@type': 'ImageObject',
        url: data.organization.logo
      }
    }
  };
}

export function generateOrganizationSchema(org: Organization) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: org.name,
    url: org.url,
    logo: {
      '@type': 'ImageObject',
      url: org.logo
    },
    sameAs: org.sameAs
  };
}

interface BlogPostData {
  title: string;
  description: string;
  authorName: string;
  datePublished: string;
  dateModified: string;
  image: string;
  url: string;
}

export function generateBlogPostSchema(data: BlogPostData) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: data.title,
    description: data.description,
    author: {
      '@type': 'Person',
      name: data.authorName
    },
    datePublished: data.datePublished,
    dateModified: data.dateModified,
    image: data.image,
    url: data.url
  };
}

interface SoftwareAppData {
  name: string;
  description: string;
  applicationCategory: string;
  operatingSystem: string;
  price: string;
  currency: string;
  ratingValue: number;
  ratingCount: number;
}

export function generateSoftwareAppSchema(data: SoftwareAppData) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: data.name,
    description: data.description,
    applicationCategory: data.applicationCategory,
    operatingSystem: data.operatingSystem,
    offers: {
      '@type': 'Offer',
      price: data.price,
      priceCurrency: data.currency
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: data.ratingValue,
      ratingCount: data.ratingCount
    }
  };
}