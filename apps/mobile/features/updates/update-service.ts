import {
  fetchNativeUpdateManifest,
  getAndroidNativeUpdate,
  type NativeUpdateAvailable,
  type NativeUpdateManifest,
} from './native-update-manifest';

export type EasUpdateCheckResult =
  | { available: false }
  | { available: true };

export type HybridUpdateResult =
  | { kind: 'none' }
  | { kind: 'native'; update: NativeUpdateAvailable }
  | { kind: 'eas' };

export type StartupUpdateCoordinator = {
  shouldStart: () => boolean;
};

export async function downloadCompatibleEasUpdate(input: {
  fetchUpdate: () => Promise<{ isNew: boolean }>;
  reload: () => Promise<void>;
}) {
  const fetchedUpdate = await input.fetchUpdate();

  if (!fetchedUpdate.isNew) {
    return false;
  }

  await input.reload();
  return true;
}

export async function checkHybridUpdate(input: {
  canCheckEasUpdates: boolean;
  checkEasUpdate: () => Promise<EasUpdateCheckResult>;
  fetchNativeManifest?: (url: string) => Promise<NativeUpdateManifest | null>;
  installedVersionCode: number;
  nativeManifestUrl: string | null;
}): Promise<HybridUpdateResult> {
  if (input.nativeManifestUrl) {
    const fetchManifest =
      input.fetchNativeManifest ??
      ((url: string) => fetchNativeUpdateManifest({ url }));
    const manifest = await fetchManifest(input.nativeManifestUrl);

    if (manifest) {
      const nativeUpdate = getAndroidNativeUpdate({
        installedVersionCode: input.installedVersionCode,
        manifest,
      });

      if (nativeUpdate) {
        return {
          kind: 'native',
          update: nativeUpdate,
        };
      }
    }
  }

  if (!input.canCheckEasUpdates) {
    return { kind: 'none' };
  }

  const easUpdate = await input.checkEasUpdate();

  return easUpdate.available ? { kind: 'eas' } : { kind: 'none' };
}

export function createStartupUpdateCoordinator(): StartupUpdateCoordinator {
  let didStart = false;

  return {
    shouldStart() {
      if (didStart) {
        return false;
      }

      didStart = true;
      return true;
    },
  };
}
