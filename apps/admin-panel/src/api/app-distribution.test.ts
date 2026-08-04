import { afterEach, describe, expect, it, vi } from 'vitest'
import { storeToken } from '../auth/session'

describe('admin app distribution API', () => {
  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('loads the protected Android distribution settings with the admin token', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://planetaryhours.in')
    storeToken('test-token')
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            platform: 'android',
            activeMode: 'direct_apk',
            isEnabled: true,
            label: 'Download Android App',
            actionUrl: '/api/v1/app-distribution/android/download',
            storeUrl: null,
            artifact: null,
          }),
        ),
      ),
    )
    vi.stubGlobal('fetch', fetchMock)
    const { getAndroidDistribution } = await import('./app-distribution')

    await expect(getAndroidDistribution()).resolves.toMatchObject({
      platform: 'android',
      activeMode: 'direct_apk',
    })
    expect(fetchMock).toHaveBeenCalledWith(
      'https://planetaryhours.in/api/v1/admin/app-distribution/android',
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    )
    const firstCall = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    const headers = firstCall[1].headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer test-token')
  })

  it('sends Google Play settings to the protected update endpoint', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://planetaryhours.in')
    storeToken('test-token')
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            platform: 'android',
            activeMode: 'google_play',
            isEnabled: true,
            label: 'Get it on Google Play',
            actionUrl: 'https://play.google.com/store/apps/details?id=com.planetaryhours.app',
            storeUrl: 'https://play.google.com/store/apps/details?id=com.planetaryhours.app',
            artifact: null,
          }),
        ),
      ),
    )
    vi.stubGlobal('fetch', fetchMock)
    const { updateAndroidDistribution } = await import('./app-distribution')

    await expect(
      updateAndroidDistribution({
        activeMode: 'google_play',
        isEnabled: true,
        storeUrl: 'https://play.google.com/store/apps/details?id=com.planetaryhours.app',
      }),
    ).resolves.toMatchObject({ activeMode: 'google_play' })
    const firstCall = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    const body = firstCall[1].body as string
    expect(body).toContain('"activeMode":"google_play"')
  })

  it('uploads APK files with metadata as multipart form data', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://planetaryhours.in')
    storeToken('test-token')
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            distribution: {
              platform: 'android',
              activeMode: 'direct_apk',
              isEnabled: true,
              label: 'Download Android App',
              actionUrl: '/api/v1/app-distribution/android/download',
              storeUrl: null,
              artifact: null,
            },
            artifact: {
              fileName: 'planetary-hours.apk',
              originalFileName: 'planetary-hours.apk',
              mimeType: 'application/vnd.android.package-archive',
              sizeBytes: 3,
              publicUrl: '/api/v1/app-distribution/android/download',
              checksumSha256: 'abc',
              versionName: '1.0.4',
              versionCode: 7,
              createdAt: '2026-08-04T00:00:00.000Z',
            },
          }),
        ),
      ),
    )
    vi.stubGlobal('fetch', fetchMock)
    const { uploadAndroidApk } = await import('./app-distribution')
    const file = new File(['apk'], 'planetary-hours.apk', {
      type: 'application/vnd.android.package-archive',
    })

    await expect(
      uploadAndroidApk({ file, versionName: '1.0.4', versionCode: '7' }),
    ).resolves.toMatchObject({
      artifact: {
        versionName: '1.0.4',
        versionCode: 7,
      },
    })
    const firstCall = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(firstCall[1].body).toBeInstanceOf(FormData)
  })
})
