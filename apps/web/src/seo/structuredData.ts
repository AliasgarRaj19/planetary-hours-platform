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

export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: organizationSeo.name,
    url: organizationSeo.url,
    email: organizationSeo.email,
  };
}
