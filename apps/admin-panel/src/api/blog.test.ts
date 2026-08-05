import { afterEach, describe, expect, it, vi } from 'vitest'
import { storeToken } from '../auth/session'

describe('admin blog API', () => {
  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('creates draft articles through the protected admin endpoint', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://planetaryhours.in')
    storeToken('test-token')
    const fetchMock = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify(createArticleResponse()))),
    )
    vi.stubGlobal('fetch', fetchMock)
    const { createArticle } = await import('./blog')

    await expect(
      createArticle({
        title: 'What Are Planetary Hours?',
        slug: 'what-are-planetary-hours',
        excerpt: 'An introduction.',
        bodyMarkdown: '# Intro',
        categoryIds: [1],
      }),
    ).resolves.toMatchObject({ status: 'draft' })

    const firstCall = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(firstCall[0]).toBe('https://planetaryhours.in/api/v1/admin/blog/articles')
    expect(firstCall[1].method).toBe('POST')
    expect(firstCall[1].body).toContain('"status":"draft"')
  })

  it('publishes and unpublishes articles through admin endpoints', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://planetaryhours.in')
    storeToken('test-token')
    const fetchMock = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify(createArticleResponse({ status: 'published' })))),
    )
    vi.stubGlobal('fetch', fetchMock)
    const { publishArticle, unpublishArticle } = await import('./blog')

    await expect(publishArticle(7)).resolves.toMatchObject({ status: 'published' })
    await unpublishArticle(7)

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://planetaryhours.in/api/v1/admin/blog/articles/7/publish',
    )
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      'https://planetaryhours.in/api/v1/admin/blog/articles/7/unpublish',
    )
  })

  it('creates blog categories through the protected admin endpoint', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://planetaryhours.in')
    storeToken('test-token')
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            id: 1,
            name: 'Planetary Hours',
            slug: 'planetary-hours',
            description: '',
            seoTitle: null,
            seoDescription: null,
            createdAt: '2026-08-05T00:00:00.000Z',
            updatedAt: '2026-08-05T00:00:00.000Z',
          }),
        ),
      ),
    )
    vi.stubGlobal('fetch', fetchMock)
    const { createCategory } = await import('./blog')

    await expect(
      createCategory({ name: 'Planetary Hours', slug: 'planetary-hours' }),
    ).resolves.toMatchObject({ slug: 'planetary-hours' })
  })
})

function createArticleResponse(overrides: Partial<{ status: string }> = {}) {
  return {
    id: 7,
    title: 'What Are Planetary Hours?',
    slug: 'what-are-planetary-hours',
    excerpt: 'An introduction.',
    bodyMarkdown: '# Intro',
    status: overrides.status ?? 'draft',
    seoTitle: null,
    seoDescription: null,
    publishedAt: null,
    createdAt: '2026-08-05T00:00:00.000Z',
    updatedAt: '2026-08-05T00:00:00.000Z',
    categories: [],
  }
}
