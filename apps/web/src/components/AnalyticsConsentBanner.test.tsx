import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('AnalyticsConsentBanner', () => {
  afterEach(() => {
    localStorage.clear();
    delete window.dataLayer;
    delete window.gtag;
    vi.resetModules();
  });

  it('stores granted consent when analytics is accepted', async () => {
    const { AnalyticsConsentBanner } = await import('./AnalyticsConsentBanner');
    const { getAnalyticsConsent } = await import('../analytics/googleAnalytics');

    render(<AnalyticsConsentBanner />);
    fireEvent.click(screen.getByRole('button', { name: 'Accept Analytics' }));

    expect(getAnalyticsConsent()).toBe('granted');
    expect(screen.queryByRole('button', { name: 'Accept Analytics' })).not.toBeInTheDocument();
  });

  it('stores denied consent when analytics is rejected', async () => {
    const { AnalyticsConsentBanner } = await import('./AnalyticsConsentBanner');
    const { getAnalyticsConsent } = await import('../analytics/googleAnalytics');

    render(<AnalyticsConsentBanner />);
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }));

    expect(getAnalyticsConsent()).toBe('denied');
  });
});
