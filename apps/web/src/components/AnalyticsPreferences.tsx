import { useEffect, useState } from 'react';
import {
  getAnalyticsConsent,
  setAnalyticsConsent,
  subscribeToAnalyticsConsent,
  type AnalyticsConsent,
} from '../analytics/googleAnalytics';

export function AnalyticsPreferences() {
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

  const label =
    consent === 'granted'
      ? 'Analytics are currently allowed.'
      : consent === 'denied'
        ? 'Analytics are currently rejected.'
        : 'Analytics preference has not been set.';

  return (
    <div className="analytics-preferences">
      <p>{label}</p>
      <div className="analytics-consent-actions">
        <button type="button" onClick={() => setAnalyticsConsent('granted')}>
          Accept Analytics
        </button>
        <button type="button" onClick={() => setAnalyticsConsent('denied')}>
          Reject Analytics
        </button>
      </div>
    </div>
  );
}
