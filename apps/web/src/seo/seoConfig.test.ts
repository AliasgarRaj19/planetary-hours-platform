import { describe, expect, it } from 'vitest';
import { getPageSeo, seoRoutes } from './seoConfig';
import { buildWebPageJsonLd } from './structuredData';

describe('schedule SEO configuration', () => {
  it('keeps /schedule registered as the canonical Schedule Table route', () => {
    const scheduleSeo = getPageSeo('/schedule');

    expect(scheduleSeo.documentTitle).toBe('Planetary Hours Schedule Table | Planetary Hours');
    expect(scheduleSeo.canonicalUrl).toBe('https://planetaryhours.in/schedule');
    expect(scheduleSeo.description).toContain('24-hour planetary hours schedule table');
  });

  it('keeps /schedule in the sitemap route registry with weekly priority settings', () => {
    const scheduleRoute = seoRoutes.find((route) => route.path === '/schedule');

    expect(scheduleRoute).toMatchObject({
      path: '/schedule',
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  });

  it('builds appropriate WebPage structured data for /schedule', () => {
    const scheduleSeo = getPageSeo('/schedule');
    const jsonLd = buildWebPageJsonLd(scheduleSeo);

    expect(jsonLd).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Planetary Hours Schedule Table',
      url: 'https://planetaryhours.in/schedule',
    });
    expect(JSON.stringify(jsonLd)).not.toContain('Event');
  });
});
