import { afterEach, describe, expect, it, vi } from 'vitest';

describe('website blog API', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('loads published article lists from the public API', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://planetaryhours.in');
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              items: [],
              pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
            }),
          ),
        ),
      ),
    );
    const { getPublishedArticles } = await import('./blog');

    await expect(getPublishedArticles()).resolves.toMatchObject({
      pagination: { page: 1 },
    });
  });

  it('loads published article lists by category from the public API', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://planetaryhours.in');
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            items: [],
            pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
          }),
        ),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { getPublishedArticlesByCategory } = await import('./blog');

    await getPublishedArticlesByCategory('planetary-hours');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://planetaryhours.in/api/v1/blog/articles?category=planetary-hours&page=1',
    );
  });

  it('loads published blog categories from the public API', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://planetaryhours.in');
    const fetchMock = vi.fn(() => Promise.resolve(new Response(JSON.stringify([]))));
    vi.stubGlobal('fetch', fetchMock);
    const { getPublishedCategories } = await import('./blog');

    await expect(getPublishedCategories()).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledWith('https://planetaryhours.in/api/v1/blog/categories');
  });

  it('turns public 404 responses into article not found errors', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://planetaryhours.in');
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('', { status: 404 }))));
    const { getPublishedArticle } = await import('./blog');

    await expect(getPublishedArticle('missing')).rejects.toThrow('Article not found.');
  });
});
