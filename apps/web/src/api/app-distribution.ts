import { defaultAndroidApkUrl } from '../config/androidRelease';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '');
const stableDownloadPath = '/api/v1/app-distribution/android/download';

export type AndroidDistribution = {
  platform: 'android';
  activeMode: 'direct_apk' | 'google_play';
  isEnabled: boolean;
  label: string;
  actionUrl: string | null;
  storeUrl: string | null;
  artifact: {
    fileName: string;
    originalFileName: string;
    mimeType: string;
    sizeBytes: number;
    publicUrl: string;
    checksumSha256: string;
    versionName: string | null;
    versionCode: number | null;
    createdAt: string;
  } | null;
};

export type AndroidDownloadAction = {
  label: string;
  distributionMode: AndroidDistribution['activeMode'] | 'fallback';
  url: string;
  source: 'runtime' | 'fallback';
};

let cachedDistributionPromise: Promise<AndroidDownloadAction> | null = null;

export function getFallbackAndroidDownloadAction(): AndroidDownloadAction {
  return {
    label: 'Download Android App',
    distributionMode: 'fallback',
    url: defaultAndroidApkUrl,
    source: 'fallback',
  };
}

export function getAndroidDownloadAction() {
  if (!cachedDistributionPromise) {
    cachedDistributionPromise = fetchAndroidDownloadAction().catch(() =>
      getFallbackAndroidDownloadAction(),
    );
  }

  return cachedDistributionPromise;
}

async function fetchAndroidDownloadAction(): Promise<AndroidDownloadAction> {
  if (!API_BASE_URL) {
    return getFallbackAndroidDownloadAction();
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/app-distribution/android`);

  if (!response.ok) {
    return getFallbackAndroidDownloadAction();
  }

  const distribution = (await response.json()) as AndroidDistribution;

  if (!distribution.isEnabled || !distribution.actionUrl) {
    return getFallbackAndroidDownloadAction();
  }

  return {
    label: distribution.label || 'Download Android App',
    distributionMode: distribution.activeMode,
    url: resolveActionUrl(distribution.actionUrl),
    source: 'runtime',
  };
}

function resolveActionUrl(actionUrl: string) {
  if (actionUrl.startsWith('/')) {
    return `${API_BASE_URL ?? ''}${actionUrl}`;
  }

  try {
    const url = new URL(actionUrl);
    return url.protocol === 'https:' ? url.toString() : defaultAndroidApkUrl;
  } catch {
    return defaultAndroidApkUrl;
  }
}
