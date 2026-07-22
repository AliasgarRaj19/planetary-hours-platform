const configuredApkUrl = import.meta.env.VITE_ANDROID_APK_URL;
const defaultApkUrl = 'http://31.97.205.245/downloads/planetary-hours-v1.0.0-beta.apk';

export function getAndroidApkUrl() {
  if (typeof configuredApkUrl !== 'string' || !configuredApkUrl.trim()) {
    return defaultApkUrl;
  }

  try {
    const trimmedUrl = configuredApkUrl.trim();

    if (trimmedUrl.startsWith('/')) {
      return trimmedUrl;
    }

    const url = new URL(trimmedUrl);
    return url.protocol === 'https:' || url.toString() === defaultApkUrl ? url.toString() : null;
  } catch {
    return null;
  }
}
