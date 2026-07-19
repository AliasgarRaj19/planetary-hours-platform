import { describe, expect, it, vi } from 'vitest';
import {
  getAndroidNativeUpdate,
  isHttpsUrl,
  parseNativeUpdateManifest,
  type NativeUpdateManifest,
} from './native-update-manifest';
import { isDeferredUntilNextLocalDay } from './update-preferences';
import {
  checkHybridUpdate,
  createStartupUpdateCoordinator,
  downloadCompatibleEasUpdate,
} from './update-service';

const manifest: NativeUpdateManifest = {
  android: {
    downloadUrl: 'https://example.com/downloads/planetary-hours-v1.0.1.apk',
    latestVersion: '1.0.1',
    latestVersionCode: 2,
    mandatory: false,
    minimumVersion: '1.0.0',
    minimumVersionCode: 1,
    publishedAt: '2026-07-19T00:00:00Z',
    releaseNotes: ['Improved location startup', 'Added update checking'],
  },
};

describe('native update manifest', () => {
  it('detects no native update when the installed build is current', () => {
    expect(
      getAndroidNativeUpdate({
        installedVersionCode: 2,
        manifest,
      }),
    ).toBeNull();
  });

  it('detects a newer native versionCode numerically', () => {
    const update = getAndroidNativeUpdate({
      installedVersionCode: 1,
      manifest,
    });

    expect(update?.latestVersionCode).toBe(2);
    expect(update?.installedVersionCode).toBe(1);
  });

  it('rejects malformed native manifests', () => {
    expect(parseNativeUpdateManifest({ android: { latestVersionCode: '2' } })).toBeNull();
  });

  it('rejects insecure HTTP URLs', () => {
    expect(isHttpsUrl('http://example.com/update.json')).toBe(false);
    expect(
      parseNativeUpdateManifest({
        android: {
          ...manifest.android,
          downloadUrl: 'http://example.com/app.apk',
        },
      }),
    ).toBeNull();
  });
});

describe('hybrid update priority', () => {
  it('returns none when no update is available', async () => {
    const result = await checkHybridUpdate({
      canCheckEasUpdates: true,
      checkEasUpdate: async () => ({ available: false }),
      fetchNativeManifest: async () => ({
        android: {
          ...manifest.android,
          latestVersionCode: 1,
        },
      }),
      installedVersionCode: 1,
      nativeManifestUrl: 'https://example.com/update.json',
    });

    expect(result.kind).toBe('none');
  });

  it('returns compatible EAS updates when native build is current', async () => {
    const result = await checkHybridUpdate({
      canCheckEasUpdates: true,
      checkEasUpdate: async () => ({ available: true }),
      fetchNativeManifest: async () => ({
        android: {
          ...manifest.android,
          latestVersionCode: 1,
        },
      }),
      installedVersionCode: 1,
      nativeManifestUrl: 'https://example.com/update.json',
    });

    expect(result.kind).toBe('eas');
  });

  it('does not check EAS updates when a newer native APK exists', async () => {
    const checkEasUpdate = vi.fn(async () => ({ available: true }) as const);
    const result = await checkHybridUpdate({
      canCheckEasUpdates: true,
      checkEasUpdate,
      fetchNativeManifest: async () => manifest,
      installedVersionCode: 1,
      nativeManifestUrl: 'https://example.com/update.json',
    });

    expect(result.kind).toBe('native');
    expect(checkEasUpdate).not.toHaveBeenCalled();
  });

  it('surfaces EAS update check failures through rejected promises', async () => {
    await expect(
      checkHybridUpdate({
        canCheckEasUpdates: true,
        checkEasUpdate: async () => {
          throw new Error('Network unavailable');
        },
        installedVersionCode: 1,
        nativeManifestUrl: null,
      }),
    ).rejects.toThrow('Network unavailable');
  });

  it('surfaces EAS update download failures before reload', async () => {
    const reload = vi.fn(async () => undefined);

    await expect(
      downloadCompatibleEasUpdate({
        fetchUpdate: async () => {
          throw new Error('Download failed');
        },
        reload,
      }),
    ).rejects.toThrow('Download failed');
    expect(reload).not.toHaveBeenCalled();
  });

  it('reloads only after a compatible EAS update downloads', async () => {
    const reload = vi.fn(async () => undefined);
    const didReload = await downloadCompatibleEasUpdate({
      fetchUpdate: async () => ({ isNew: true }),
      reload,
    });

    expect(didReload).toBe(true);
    expect(reload).toHaveBeenCalledOnce();
  });
});

describe('update prompt preferences', () => {
  it('defers automatic prompts until the next local calendar day', () => {
    const deferredAt = new Date(2026, 6, 19, 9).toISOString();

    expect(
      isDeferredUntilNextLocalDay({
        deferredAt,
        now: new Date(2026, 6, 19, 20),
      }),
    ).toBe(true);
    expect(
      isDeferredUntilNextLocalDay({
        deferredAt,
        now: new Date(2026, 6, 20, 1),
      }),
    ).toBe(false);
  });

  it('manual checks can bypass deferral by running the hybrid check directly', async () => {
    const result = await checkHybridUpdate({
      canCheckEasUpdates: true,
      checkEasUpdate: async () => ({ available: true }),
      installedVersionCode: 1,
      nativeManifestUrl: null,
    });

    expect(result.kind).toBe('eas');
  });

  it('prevents duplicate startup checks', () => {
    const coordinator = createStartupUpdateCoordinator();

    expect(coordinator.shouldStart()).toBe(true);
    expect(coordinator.shouldStart()).toBe(false);
  });
});
