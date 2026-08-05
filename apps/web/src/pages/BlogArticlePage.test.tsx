import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('BlogArticlePage', () => {
  afterEach(() => {
    cleanup();
    document.head.innerHTML = '';
    document.title = '';
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('clears old article content and SEO while a new slug is loading', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://planetaryhours.in');
    const secondRequest = new Promise<Response>(() => {});
    const fetchMock = vi.fn((input: string | URL | Request) => {
      const url = String(input);

      if (url.includes('/api/v1/blog/articles/article-a')) {
        return Promise.resolve(
          new Response(JSON.stringify(createArticleResponse('article-a', 'Article A'))),
        );
      }

      if (url.includes('/api/v1/blog/articles/article-b')) {
        return secondRequest;
      }

      return Promise.resolve(new Response(JSON.stringify(createDownloadAction())));
    });
    vi.stubGlobal('fetch', fetchMock);
    const { BlogArticlePage } = await import('./BlogArticlePage');

    const { rerender } = render(<BlogArticlePage slug="article-a" />);

    expect(await screen.findByRole('heading', { name: 'Article A' })).toBeInTheDocument();
    await waitFor(() => {
      expect(document.title).toBe('Article A | Planetary Hours');
      expect(document.getElementById('article-json-ld')).toBeTruthy();
    });

    rerender(<BlogArticlePage slug="article-b" />);

    expect(screen.getByText('Loading article...')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Article A' })).not.toBeInTheDocument();

    await waitFor(() => {
      expect(document.title).toBe('Planetary Hours');
      expect(document.getElementById('article-json-ld')).toBeNull();
    });
  });

  it('does not retain previous article metadata after a not-found response', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://planetaryhours.in');
    const fetchMock = vi.fn((input: string | URL | Request) => {
      const url = String(input);

      if (url.includes('/api/v1/blog/articles/article-a')) {
        return Promise.resolve(
          new Response(JSON.stringify(createArticleResponse('article-a', 'Article A'))),
        );
      }

      if (url.includes('/api/v1/blog/articles/missing-article')) {
        return Promise.resolve(new Response('', { status: 404 }));
      }

      return Promise.resolve(new Response(JSON.stringify(createDownloadAction())));
    });
    vi.stubGlobal('fetch', fetchMock);
    const { BlogArticlePage } = await import('./BlogArticlePage');

    const { rerender } = render(<BlogArticlePage slug="article-a" />);

    expect(await screen.findByRole('heading', { name: 'Article A' })).toBeInTheDocument();

    rerender(<BlogArticlePage slug="missing-article" />);

    expect(await screen.findByRole('heading', { name: 'Article not found' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Article A' })).not.toBeInTheDocument();
    expect(document.title).toBe('Planetary Hours');
    expect(document.getElementById('article-json-ld')).toBeNull();
  });
});

function createArticleResponse(slug: string, title: string) {
  return {
    id: 1,
    title,
    slug,
    excerpt: `${title} excerpt.`,
    bodyMarkdown: '# Body',
    status: 'published',
    seoTitle: null,
    seoDescription: null,
    publishedAt: '2026-08-05T00:00:00.000Z',
    createdAt: '2026-08-05T00:00:00.000Z',
    updatedAt: '2026-08-05T01:00:00.000Z',
    categories: [],
  };
}

function createDownloadAction() {
  return {
    mode: 'direct_apk',
    label: 'Download the app',
    url: 'https://planetaryhours.in/downloads/planetary-hours-1.0.3-build6.apk',
  };
}
