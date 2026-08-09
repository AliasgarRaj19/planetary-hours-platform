import { registerAs } from '@nestjs/config';

export const analyticsConfig = registerAs('analytics', () => ({
  apiTimeoutMs: parsePositiveInteger(process.env.GA4_API_TIMEOUT_MS, 8000),
  credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS ?? '',
  historicalCacheSeconds: parsePositiveInteger(
    process.env.GA4_HISTORICAL_CACHE_SECONDS,
    900,
  ),
  propertyId: process.env.GA4_PROPERTY_ID ?? '',
  realtimeCacheSeconds: parsePositiveInteger(
    process.env.GA4_REALTIME_CACHE_SECONDS,
    30,
  ),
}));

function parsePositiveInteger(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallback;
}
