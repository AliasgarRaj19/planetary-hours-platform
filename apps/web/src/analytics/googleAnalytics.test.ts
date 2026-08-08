import { afterEach, describe, expect, it, vi } from 'vitest';

describe('Google Analytics utility', () => {
  afterEach(() => {
    localStorage.clear();
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    delete window.dataLayer;
    delete window.gtag;
    window.history.replaceState({}, '', '/');
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('no-ops when no Measurement ID is configured', async () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', '');
    const analytics = await import('./googleAnalytics');

    analytics.setAnalyticsConsent('granted');
    analytics.initializeGoogleAnalytics();
    analytics.trackPageView('/schedule');
    analytics.trackEvent('app_download_click', { link_location: 'header' });

    expect(document.querySelector('script[src*="googletagmanager.com"]')).toBeNull();
    expect(window.gtag).toBeUndefined();
  });

  it('does not load GA when consent is denied', async () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-5XQ5NGQ13N');
    const analytics = await import('./googleAnalytics');

    analytics.setAnalyticsConsent('denied');
    analytics.initializeGoogleAnalytics();
    analytics.trackPageView('/schedule');

    expect(document.querySelector('script[src*="googletagmanager.com"]')).toBeNull();
    expect(window.gtag).toBeUndefined();
  });

  it('persists consent and initializes GA once with manual page views enabled', async () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-5XQ5NGQ13N');
    const analytics = await import('./googleAnalytics');

    analytics.setAnalyticsConsent('granted');
    analytics.initializeGoogleAnalytics();
    analytics.initializeGoogleAnalytics();

    expect(analytics.getAnalyticsConsent()).toBe('granted');
    expect(document.querySelectorAll('script[src*="googletagmanager.com"]')).toHaveLength(1);
    expect(window.dataLayer).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ 0: 'config', 1: 'G-5XQ5NGQ13N', 2: { send_page_view: false } }),
      ]),
    );
  });

  it('tracks one manual page view per route path after consent', async () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-5XQ5NGQ13N');
    window.history.replaceState({}, '', '/blog?category=planetary-hours');
    const analytics = await import('./googleAnalytics');

    analytics.setAnalyticsConsent('granted');
    analytics.trackPageView('/blog?category=planetary-hours');
    analytics.trackPageView('/blog?category=planetary-hours');

    const pageViews = window.dataLayer?.filter(
      (entry) =>
        typeof entry === 'object' &&
        entry !== null &&
        (entry as Record<number, unknown>)[0] === 'event' &&
        (entry as Record<number, unknown>)[1] === 'page_view',
    );

    expect(pageViews).toHaveLength(1);
    expect(pageViews?.[0]).toMatchObject({
      2: expect.objectContaining({
        page_path: '/blog?category=planetary-hours',
      }),
    });
  });

  it('stops future analytics after consent changes to denied', async () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-5XQ5NGQ13N');
    const analytics = await import('./googleAnalytics');

    analytics.setAnalyticsConsent('granted');
    analytics.trackEvent('app_download_click', { link_location: 'header' });
    analytics.setAnalyticsConsent('denied');
    analytics.trackEvent('app_download_click', { link_location: 'footer' });

    const downloadEvents = window.dataLayer?.filter(
      (entry) =>
        typeof entry === 'object' &&
        entry !== null &&
        (entry as Record<number, unknown>)[0] === 'event' &&
        (entry as Record<number, unknown>)[1] === 'app_download_click',
    );

    expect(downloadEvents).toHaveLength(1);
  });
});
