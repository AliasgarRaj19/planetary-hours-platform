import { afterEach, describe, expect, it, vi } from 'vitest';

describe('mobile blog API', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('loads published categories from the public API', async () => {
    vi.stubEnv('EXPO_PUBLIC_API_BASE_URL', 'https://planetaryhours.in');
    const fetchMock = vi.fn(() => Promise.resolve(new Response(JSON.stringify([]))));
    vi.stubGlobal('fetch', fetchMock);
    const { getBlogCategories } = await import('./blog');

    await expect(getBlogCategories()).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://planetaryhours.in/api/v1/blog/categories',
      { signal: undefined },
    );
  });

  it('loads latest articles and category-filtered articles from the public API', async () => {
    vi.stubEnv('EXPO_PUBLIC_API_BASE_URL', 'https://planetaryhours.in');
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
    const { getBlogArticles } = await import('./blog');

    await getBlogArticles();
    await getBlogArticles('planetary-hours');

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://planetaryhours.in/api/v1/blog/articles?page=1',
      { signal: undefined },
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://planetaryhours.in/api/v1/blog/articles?page=1&category=planetary-hours',
      { signal: undefined },
    );
  });

  it('loads article detail by slug and handles not found responses', async () => {
    vi.stubEnv('EXPO_PUBLIC_API_BASE_URL', 'https://planetaryhours.in');
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ slug: 'intro' })))
      .mockResolvedValueOnce(new Response('', { status: 404 }));
    vi.stubGlobal('fetch', fetchMock);
    const { getBlogArticle } = await import('./blog');

    await expect(getBlogArticle('intro')).resolves.toMatchObject({ slug: 'intro' });
    await expect(getBlogArticle('missing')).rejects.toThrow('Article not found.');
  });
});
