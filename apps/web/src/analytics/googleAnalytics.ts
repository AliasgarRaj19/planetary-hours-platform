const analyticsConsentKey = 'planetary_hours_analytics_consent';
const consentChangedEventName = 'planetary-hours-analytics-consent-changed';
const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() ?? '';

export type AnalyticsConsent = 'granted' | 'denied';
export type AnalyticsEventParams = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let initializedMeasurementId: string | null = null;
let lastTrackedPagePath = '';

export function getAnalyticsConsent(): AnalyticsConsent | null {
  try {
    const storedValue = window.localStorage.getItem(analyticsConsentKey);
    return storedValue === 'granted' || storedValue === 'denied' ? storedValue : null;
  } catch {
    return null;
  }
}

export function setAnalyticsConsent(consent: AnalyticsConsent) {
  try {
    window.localStorage.setItem(analyticsConsentKey, consent);
  } catch {
    // Local storage may be unavailable in strict browser settings.
  }

  if (consent === 'denied') {
    lastTrackedPagePath = '';
    removeGoogleAnalyticsCookies();
  }

  window.dispatchEvent(
    new CustomEvent(consentChangedEventName, {
      detail: consent,
    }),
  );
}

export function subscribeToAnalyticsConsent(
  listener: (consent: AnalyticsConsent | null) => void,
) {
  function handleConsentChange() {
    listener(getAnalyticsConsent());
  }

  window.addEventListener(consentChangedEventName, handleConsentChange);
  return () => window.removeEventListener(consentChangedEventName, handleConsentChange);
}

export function isAnalyticsEnabled() {
  return Boolean(measurementId) && getAnalyticsConsent() === 'granted';
}

export function initializeGoogleAnalytics() {
  if (!isAnalyticsEnabled() || initializedMeasurementId === measurementId) {
    return false;
  }

  window.dataLayer = window.dataLayer ?? [];
  window.gtag =
    window.gtag ??
    function gtag() {
      window.dataLayer?.push(arguments);
    };

  injectGoogleAnalyticsScript(measurementId);
  window.gtag('js', new Date());
  window.gtag('config', measurementId, { send_page_view: false });
  initializedMeasurementId = measurementId;
  return true;
}

export function trackPageView(path: string, title = document.title) {
  if (!isAnalyticsEnabled()) {
    return;
  }

  initializeGoogleAnalytics();

  if (!window.gtag || path === lastTrackedPagePath) {
    return;
  }

  window.gtag('event', 'page_view', {
    page_location: window.location.origin ? `${window.location.origin}${path}` : path,
    page_path: path,
    page_title: title,
  });
  lastTrackedPagePath = path;
}

export function trackEvent(eventName: string, params: AnalyticsEventParams = {}) {
  if (!isAnalyticsEnabled()) {
    return;
  }

  initializeGoogleAnalytics();
  window.gtag?.('event', eventName, sanitizeEventParams(params));
}

export function getCurrentRoutePath() {
  return `${window.location.pathname}${window.location.search}`;
}

export function resetTrackedPageView() {
  lastTrackedPagePath = '';
}

function injectGoogleAnalyticsScript(id: string) {
  const scriptId = `ga4-script-${id}`;

  if (document.getElementById(scriptId)) {
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.id = scriptId;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.append(script);
}

function sanitizeEventParams(params: AnalyticsEventParams) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null),
  );
}

function removeGoogleAnalyticsCookies() {
  if (typeof document === 'undefined') {
    return;
  }

  const expires = 'Thu, 01 Jan 1970 00:00:00 GMT';
  const cookieNames = document.cookie
    .split(';')
    .map((cookie) => cookie.trim().split('=')[0])
    .filter((name) => name === '_ga' || name.startsWith('_ga_'));

  for (const name of cookieNames) {
    document.cookie = `${name}=; expires=${expires}; path=/`;
    document.cookie = `${name}=; expires=${expires}; path=/; domain=${window.location.hostname}`;
  }
}

export const analyticsInternalsForTests = {
  consentChangedEventName,
  consentKey: analyticsConsentKey,
  reset() {
    initializedMeasurementId = null;
    lastTrackedPagePath = '';
    delete window.dataLayer;
    delete window.gtag;
    document
      .querySelectorAll('script[id^="ga4-script-"]')
      .forEach((script) => script.remove());
  },
};
