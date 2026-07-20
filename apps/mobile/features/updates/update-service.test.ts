import { describe, expect, it, vi } from 'vitest';
import {
  fetchAndroidUpdateManifest,
  getAndroidUpdate,
  parseAndroidUpdateManifest,
  type AndroidUpdateManifest,
} from '../../src/services/updateService';
import {
  checkHybridUpdate,
  createStartupUpdateCoordinator,
  downloadCompatibleEasUpdate,
} from './update-service';
import { isDeferredUntilNextLocalDay as isDeferredUntilNextLocalDayPreference } from './update-preferences';

const manifest: AndroidUpdateManifest = {
  apkUrl: 'http://31.97.205.245/downloads/planetary-hours-v1.0.0-beta.apk',
  build: 2,
  publishedAt: '2026-07-20T00:00:00Z',
  releaseNotes: ['Added self-hosted update checks', 'Improved beta downloads'],
  required: false,
  version: '1.0.0',
};

describe('Android update manifest', () => {
  it('parses the VPS manifest schema', () => {
    expect(parseAndroidUpdateManifest(manifest)).toEqual(manifest);
  });

  it('rejects invalid manifest JSON shapes', () => {
    expect(parseAndroidUpdateManifest({ build: '2' })).toBeNull();
    expect(parseAndroidUpdateManifest({ ...manifest, releaseNotes: [1] })).toBeNull();
    expect(parseAndroidUpdateManifest({ ...manifest, apkUrl: 'file:///app.apk' })).toBeNull();
  });

  it('detects a newer build numerically', () => {
    const update = getAndroidUpdate({
      installedBuild: 1,
      manifest,
    });

    expect(update?.build).toBe(2);
    expect(update?.installedBuild).toBe(1);
  });

  it('returns no update when the installed build is current', () => {
    expect(
      getAndroidUpdate({
        installedBuild: 2,
        manifest,
      }),
    ).toBeNull();
  });

  it('fetches and parses update JSON once', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify(manifest)));

    await expect(fetchAndroidUpdateManifest({ fetchImpl })).resolves.toEqual(manifest);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it('surfaces invalid JSON with a friendly message', async () => {
    const fetchImpl = vi.fn(async () => new Response('{'));

    await expect(fetchAndroidUpdateManifest({ fetchImpl })).rejects.toThrow(
      'Update information is temporarily unavailable.',
    );
  });

  it('surfaces server errors with a friendly message', async () => {
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 503 }));

    await expect(fetchAndroidUpdateManifest({ fetchImpl })).rejects.toThrow(
      'Update server is unavailable. Please try again later.',
    );
  });
});

describe('hybrid update priority', () => {
  it('returns none when no update is available', async () => {
    const result = await checkHybridUpdate({
      canCheckEasUpdates: true,
      checkEasUpdate: async () => ({ available: false }),
      fetchNativeManifest: async () => ({
        ...manifest,
        build: 1,
      }),
      installedVersionCode: 1,
      nativeManifestUrl: 'http://31.97.205.245/downloads/android-update.json',
    });

    expect(result.kind).toBe('none');
  });

  it('returns compatible EAS updates when the native build is current', async () => {
    const result = await checkHybridUpdate({
      canCheckEasUpdates: true,
      checkEasUpdate: async () => ({ available: true }),
      fetchNativeManifest: async () => ({
        ...manifest,
        build: 1,
      }),
      installedVersionCode: 1,
      nativeManifestUrl: 'http://31.97.205.245/downloads/android-update.json',
    });

    expect(result.kind).toBe('eas');
  });

  it('does not check EAS updates when a newer APK exists', async () => {
    const checkEasUpdate = vi.fn(async () => ({ available: true }) as const);
    const result = await checkHybridUpdate({
      canCheckEasUpdates: true,
      checkEasUpdate,
      fetchNativeManifest: async () => manifest,
      installedVersionCode: 1,
      nativeManifestUrl: 'http://31.97.205.245/downloads/android-update.json',
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
      isDeferredUntilNextLocalDayPreference({
        deferredAt,
        now: new Date(2026, 6, 19, 20),
      }),
    ).toBe(true);
    expect(
      isDeferredUntilNextLocalDayPreference({
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
