import { useEffect, useState } from 'react';
import {
  getAnalyticsConsent,
  setAnalyticsConsent,
  subscribeToAnalyticsConsent,
  type AnalyticsConsent,
} from '../analytics/googleAnalytics';

export function AnalyticsConsentBanner() {
  const [consent, setConsent] = useState<AnalyticsConsent | null>(() =>
    getAnalyticsConsent(),
  );

  useEffect(
    () =>
      subscribeToAnalyticsConsent((nextConsent) => {
        setConsent(nextConsent);
      }),
    [],
  );

  if (consent) {
    return null;
  }

  return (
    <section
      aria-label="Analytics preferences"
      className="analytics-consent-banner">
      <div>
        <h2>Optional analytics</h2>
        <p>
          Help improve Planetary Hours by allowing privacy-conscious usage analytics. We do not
          send precise location coordinates, contact messages, emails, or admin data to analytics.
        </p>
      </div>
      <div className="analytics-consent-actions">
        <button type="button" onClick={() => setAnalyticsConsent('granted')}>
          Accept Analytics
        </button>
        <button type="button" onClick={() => setAnalyticsConsent('denied')}>
          Reject
        </button>
      </div>
    </section>
  );
}
