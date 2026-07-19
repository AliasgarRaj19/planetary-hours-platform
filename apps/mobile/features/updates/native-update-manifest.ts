export type NativeUpdateManifest = {
  android: NativeUpdateRelease;
};

export type NativeUpdateRelease = {
  downloadUrl: string;
  latestVersion: string;
  latestVersionCode: number;
  mandatory: boolean;
  minimumVersion: string;
  minimumVersionCode: number;
  publishedAt: string;
  releaseNotes: string[];
};

export type NativeUpdateAvailable = NativeUpdateRelease & {
  installedVersionCode: number;
};

const DEFAULT_TIMEOUT_MS = 8000;

export function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

export async function fetchNativeUpdateManifest(input: {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  url: string;
}): Promise<NativeUpdateManifest | null> {
  if (!isHttpsUrl(input.url)) {
    throw new Error('Native update manifest URL must use HTTPS.');
  }

  const fetchImpl = input.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    input.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );

  try {
    const response = await fetchImpl(input.url, {
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error('Native update manifest is unavailable.');
    }

    const data = (await response.json()) as unknown;
    const manifest = parseNativeUpdateManifest(data);

    if (!manifest) {
      throw new Error('Native update manifest is malformed.');
    }

    return manifest;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function parseNativeUpdateManifest(value: unknown): NativeUpdateManifest | null {
  if (!isRecord(value) || !isRecord(value.android)) {
    return null;
  }

  const android = parseNativeUpdateRelease(value.android);

  if (!android) {
    return null;
  }

  return { android };
}

export function getAndroidNativeUpdate(input: {
  installedVersionCode: number;
  manifest: NativeUpdateManifest;
}): NativeUpdateAvailable | null {
  const release = input.manifest.android;

  if (release.latestVersionCode <= input.installedVersionCode) {
    return null;
  }

  return {
    ...release,
    installedVersionCode: input.installedVersionCode,
  };
}

function parseNativeUpdateRelease(value: Record<string, unknown>): NativeUpdateRelease | null {
  const {
    downloadUrl,
    latestVersion,
    latestVersionCode,
    mandatory,
    minimumVersion,
    minimumVersionCode,
    publishedAt,
    releaseNotes,
  } = value;

  if (
    typeof downloadUrl !== 'string' ||
    typeof latestVersion !== 'string' ||
    typeof latestVersionCode !== 'number' ||
    typeof mandatory !== 'boolean' ||
    typeof minimumVersion !== 'string' ||
    typeof minimumVersionCode !== 'number' ||
    typeof publishedAt !== 'string' ||
    !Array.isArray(releaseNotes) ||
    !releaseNotes.every((note) => typeof note === 'string') ||
    !isHttpsUrl(downloadUrl)
  ) {
    return null;
  }

  return {
    downloadUrl,
    latestVersion,
    latestVersionCode,
    mandatory,
    minimumVersion,
    minimumVersionCode,
    publishedAt,
    releaseNotes,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
