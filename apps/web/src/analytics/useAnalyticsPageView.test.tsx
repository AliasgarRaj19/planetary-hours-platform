import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('useAnalyticsPageView', () => {
  afterEach(() => {
    localStorage.clear();
    document.head.innerHTML = '';
    delete window.dataLayer;
    delete window.gtag;
    window.history.replaceState({}, '', '/');
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('tracks a route once after consent and includes the query string', async () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-5XQ5NGQ13N');
    window.history.replaceState({}, '', '/blog?category=planetary-hours');
    const { setAnalyticsConsent } = await import('./googleAnalytics');
    const { useAnalyticsPageView } = await import('./useAnalyticsPageView');

    function TestPage({ routePath }: { routePath: string }) {
      useAnalyticsPageView(routePath);
      return null;
    }

    setAnalyticsConsent('granted');
    const { rerender } = render(<TestPage routePath="/blog?category=planetary-hours" />);
    rerender(<TestPage routePath="/blog?category=planetary-hours" />);

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

  it('sends one current-route page view when consent is granted after the page loads', async () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-5XQ5NGQ13N');
    window.history.replaceState({}, '', '/schedule');
    const { setAnalyticsConsent } = await import('./googleAnalytics');
    const { useAnalyticsPageView } = await import('./useAnalyticsPageView');

    function TestPage() {
      useAnalyticsPageView('/schedule');
      return null;
    }

    render(<TestPage />);
    expect(window.dataLayer).toBeUndefined();

    setAnalyticsConsent('granted');

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
        page_path: '/schedule',
      }),
    });
  });
});
