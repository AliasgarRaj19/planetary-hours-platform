export const ANDROID_UPDATE_MANIFEST_URL =
  'http://31.97.205.245/downloads/android-update.json';

export type AndroidUpdateManifest = {
  apkUrl: string;
  build: number;
  publishedAt: string;
  releaseNotes: string[];
  required: boolean;
  version: string;
};

export type AndroidUpdateAvailable = AndroidUpdateManifest & {
  installedBuild: number;
};

const DEFAULT_TIMEOUT_MS = 8000;

export async function fetchAndroidUpdateManifest(input: {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  url?: string;
} = {}): Promise<AndroidUpdateManifest> {
  const url = input.url ?? ANDROID_UPDATE_MANIFEST_URL;
  const fetchImpl = input.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    input.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );

  try {
    const response = await fetchImpl(url, {
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error('Update server is unavailable. Please try again later.');
    }

    const payload = (await response.json()) as unknown;
    const manifest = parseAndroidUpdateManifest(payload);

    if (!manifest) {
      throw new Error('Update information is temporarily unavailable.');
    }

    return manifest;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Update check timed out. Please try again.');
      }

      if (error instanceof SyntaxError) {
        throw new Error('Update information is temporarily unavailable.');
      }

      if (
        error.message === 'Update server is unavailable. Please try again later.' ||
        error.message === 'Update information is temporarily unavailable.'
      ) {
        throw error;
      }
    }

    throw new Error('Unable to check for updates. Please check your connection.');
  } finally {
    clearTimeout(timeoutId);
  }
}

export function parseAndroidUpdateManifest(value: unknown): AndroidUpdateManifest | null {
  if (!isRecord(value)) {
    return null;
  }

  const { apkUrl, build, publishedAt, releaseNotes, required, version } = value;

  if (
    typeof apkUrl !== 'string' ||
    typeof build !== 'number' ||
    !Number.isFinite(build) ||
    typeof publishedAt !== 'string' ||
    !Array.isArray(releaseNotes) ||
    !releaseNotes.every((note) => typeof note === 'string') ||
    typeof required !== 'boolean' ||
    typeof version !== 'string'
  ) {
    return null;
  }

  try {
    const parsedApkUrl = new URL(apkUrl);

    if (parsedApkUrl.protocol !== 'http:' && parsedApkUrl.protocol !== 'https:') {
      return null;
    }
  } catch {
    return null;
  }

  return {
    apkUrl,
    build,
    publishedAt,
    releaseNotes,
    required,
    version,
  };
}

export function getAndroidUpdate(input: {
  installedBuild: number;
  manifest: AndroidUpdateManifest;
}): AndroidUpdateAvailable | null {
  if (input.manifest.build <= input.installedBuild) {
    return null;
  }

  return {
    ...input.manifest,
    installedBuild: input.installedBuild,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
