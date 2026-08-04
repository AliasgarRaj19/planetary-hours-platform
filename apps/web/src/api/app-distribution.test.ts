import { afterEach, describe, expect, it, vi } from 'vitest';
import { defaultAndroidApkUrl } from '../config/androidRelease';

describe('website app distribution API', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('returns the current APK fallback when the runtime API is unavailable', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://planetaryhours.in');
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))));
    const { getAndroidDownloadAction } = await import('./app-distribution');

    await expect(getAndroidDownloadAction()).resolves.toEqual({
      label: 'Download Android App',
      url: defaultAndroidApkUrl,
      source: 'fallback',
    });
  });

  it('resolves the stable backend download endpoint for Direct APK mode', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://planetaryhours.in');
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
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
      ),
    );
    const { getAndroidDownloadAction } = await import('./app-distribution');

    await expect(getAndroidDownloadAction()).resolves.toEqual({
      label: 'Download Android App',
      url: 'https://planetaryhours.in/api/v1/app-distribution/android/download',
      source: 'runtime',
    });
  });

  it('uses the Play Store URL returned by Google Play mode', async () => {
    const playUrl = 'https://play.google.com/store/apps/details?id=com.planetaryhours.app';
    vi.stubEnv('VITE_API_BASE_URL', 'https://planetaryhours.in');
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              platform: 'android',
              activeMode: 'google_play',
              isEnabled: true,
              label: 'Get it on Google Play',
              actionUrl: playUrl,
              storeUrl: playUrl,
              artifact: null,
            }),
          ),
        ),
      ),
    );
    const { getAndroidDownloadAction } = await import('./app-distribution');

    await expect(getAndroidDownloadAction()).resolves.toEqual({
      label: 'Get it on Google Play',
      url: playUrl,
      source: 'runtime',
    });
  });
});
