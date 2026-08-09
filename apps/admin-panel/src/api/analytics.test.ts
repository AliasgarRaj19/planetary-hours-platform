import { afterEach, describe, expect, it, vi } from 'vitest'
import { storeToken } from '../auth/session'

describe('admin analytics API', () => {
  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('loads analytics reports with the admin token', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://planetaryhours.in')
    storeToken('test-token')
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            range: '7d',
            users: 10,
            sessions: 5,
            views: 20,
            engagementRate: 0.5,
            averageEngagementTimeSeconds: 12,
            refreshedAt: '2026-08-09T00:00:00.000Z',
          }),
        ),
      ),
    )
    vi.stubGlobal('fetch', fetchMock)
    const { getAnalyticsOverview } = await import('./analytics')

    await expect(getAnalyticsOverview('7d')).resolves.toMatchObject({
      users: 10,
    })
    expect(fetchMock).toHaveBeenCalledWith(
      'https://planetaryhours.in/api/v1/admin/analytics/overview?range=7d',
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    )
    const firstCall = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    const headers = firstCall[1].headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer test-token')
  })

  it('clears the stored token when the analytics API returns 401', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://planetaryhours.in')
    storeToken('test-token')
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('', { status: 401 }))))
    const { getAnalyticsRealtime } = await import('./analytics')

    await expect(getAnalyticsRealtime()).rejects.toThrow(
      'Your session has expired. Please sign in again.',
    )
    expect(localStorage.getItem('planetary-hours.admin-token.v1')).toBeNull()
  })
})
