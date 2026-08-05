import {
  organizationSeo,
  siteSeo,
  type SeoPageMetadata,
} from './seoConfig';

export function buildWebSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteSeo.name,
    url: siteSeo.url,
    description: siteSeo.defaultDescription,
    publisher: {
      '@type': 'Organization',
      name: organizationSeo.name,
      url: organizationSeo.url,
    },
  };
}

export function buildWebApplicationJsonLd(pageSeo: SeoPageMetadata) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: siteSeo.name,
    url: siteSeo.url,
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Web',
    description: pageSeo.description,
    publisher: {
      '@type': 'Organization',
      name: organizationSeo.name,
      url: organizationSeo.url,
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };
}

export function buildWebPageJsonLd(pageSeo: SeoPageMetadata) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: pageSeo.title,
    url: pageSeo.canonicalUrl,
    description: pageSeo.description,
    isPartOf: {
      '@type': 'WebSite',
      name: siteSeo.name,
      url: siteSeo.url,
    },
    publisher: {
      '@type': 'Organization',
      name: organizationSeo.name,
      url: organizationSeo.url,
    },
  };
}

export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: organizationSeo.name,
    url: organizationSeo.url,
    email: organizationSeo.email,
  };
}

export function buildArticleJsonLd(input: {
  canonicalUrl: string;
  description: string;
  publishedAt?: string | null;
  title: string;
  updatedAt?: string | null;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.title,
    description: input.description,
    url: input.canonicalUrl,
    datePublished: input.publishedAt ?? undefined,
    dateModified: input.updatedAt ?? input.publishedAt ?? undefined,
    publisher: {
      '@type': 'Organization',
      name: organizationSeo.name,
      url: organizationSeo.url,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': input.canonicalUrl,
    },
  };
}
