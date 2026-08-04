const configuredApkUrl = import.meta.env.VITE_ANDROID_APK_URL;
export const defaultAndroidApkUrl =
  'https://planetaryhours.in/downloads/planetary-hours-1.0.3-build6.apk';

export function getAndroidApkUrl() {
  if (typeof configuredApkUrl !== 'string' || !configuredApkUrl.trim()) {
    return defaultAndroidApkUrl;
  }

  try {
    const trimmedUrl = configuredApkUrl.trim();

    if (trimmedUrl.startsWith('/')) {
      return trimmedUrl;
    }

    const url = new URL(trimmedUrl);
    return url.protocol === 'https:' || url.toString() === defaultAndroidApkUrl
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}
