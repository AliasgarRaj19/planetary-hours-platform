import { afterEach, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { render } from '@testing-library/react';
import { buildArticleJsonLd } from './structuredData';
import { getPageSeo, seoRoutes } from './seoConfig';
import { useDynamicSeo, type DynamicSeoInput } from './useDynamicSeo';

describe('blog SEO configuration', () => {
  afterEach(() => {
    document.head.innerHTML = '';
    document.title = '';
  });

  it('registers /blog as a static canonical route', () => {
    const blogSeo = getPageSeo('/blog');

    expect(blogSeo.canonicalUrl).toBe('https://planetaryhours.in/blog');
    expect(blogSeo.documentTitle).toBe('Planetary Hours Blog | Planetary Hours');
    expect(seoRoutes.find((route) => route.path === '/blog')).toMatchObject({
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  });

  it('builds Article JSON-LD for dynamic article pages', () => {
    const jsonLd = buildArticleJsonLd({
      canonicalUrl: 'https://planetaryhours.in/blog/what-are-planetary-hours',
      description: 'Learn what planetary hours are.',
      publishedAt: '2026-08-05T00:00:00.000Z',
      title: 'What Are Planetary Hours?',
      updatedAt: '2026-08-05T01:00:00.000Z',
    });

    expect(jsonLd).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'What Are Planetary Hours?',
      url: 'https://planetaryhours.in/blog/what-are-planetary-hours',
    });
  });

  it('removes Article JSON-LD when dynamic article SEO is cleared', () => {
    const { rerender } = render(
      createElement(DynamicSeoHarness, {
        input: {
          title: 'Article A',
          description: 'Article A description.',
          path: '/blog/article-a',
          type: 'article',
          publishedAt: '2026-08-05T00:00:00.000Z',
          updatedAt: '2026-08-05T01:00:00.000Z',
        },
      }),
    );

    expect(document.getElementById('article-json-ld')).toBeTruthy();

    rerender(createElement(DynamicSeoHarness, { input: null }));

    expect(document.getElementById('article-json-ld')).toBeNull();
    expect(document.title).toBe('Planetary Hours');
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://planetaryhours.in',
    );
  });

  it('removes Article JSON-LD when navigating from an article to a static page', () => {
    const { unmount } = render(
      createElement(DynamicSeoHarness, {
        input: {
          title: 'Article A',
          description: 'Article A description.',
          path: '/blog/article-a',
          type: 'article',
        },
      }),
    );

    expect(document.getElementById('article-json-ld')).toBeTruthy();

    unmount();

    expect(document.getElementById('article-json-ld')).toBeNull();
  });

  it('does not preserve article A metadata while article B is loading', () => {
    const { rerender } = render(
      createElement(DynamicSeoHarness, {
        input: {
          title: 'Article A',
          description: 'Article A description.',
          path: '/blog/article-a',
          type: 'article',
        },
      }),
    );

    expect(document.title).toBe('Article A | Planetary Hours');
    expect(document.getElementById('article-json-ld')).toBeTruthy();

    rerender(createElement(DynamicSeoHarness, { input: null }));

    expect(document.title).toBe('Planetary Hours');
    expect(document.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe(
      'Planetary Hours',
    );
    expect(document.getElementById('article-json-ld')).toBeNull();
  });
});

function DynamicSeoHarness({ input }: { input: DynamicSeoInput | null }) {
  useDynamicSeo(input);
  return null;
}
