import { useEffect } from 'react';
import {
  getCurrentRoutePath,
  initializeGoogleAnalytics,
  resetTrackedPageView,
  subscribeToAnalyticsConsent,
  trackPageView,
} from './googleAnalytics';

export function useAnalyticsPageView(routePath: string) {
  useEffect(() => {
    initializeGoogleAnalytics();
    trackPageView(routePath);

    return subscribeToAnalyticsConsent((consent) => {
      if (consent === 'granted') {
        resetTrackedPageView();
        initializeGoogleAnalytics();
        trackPageView(getCurrentRoutePath());
      }
    });
  }, [routePath]);
}
