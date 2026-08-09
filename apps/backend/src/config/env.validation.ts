const validNodeEnvironments = new Set(['development', 'production', 'test']);

export function validateEnvironment(config: Record<string, unknown>) {
  const nodeEnv = readString(config.NODE_ENV) ?? 'development';
  const port = readString(config.PORT);
  const databaseUrl = readString(config.DATABASE_URL);
  const adminPasswordHash = readString(config.ADMIN_PASSWORD_HASH);
  const adminUsername = readString(config.ADMIN_USERNAME);
  const maxApkUploadBytes = readString(config.MAX_APK_UPLOAD_BYTES);
  const jwtSecret = readString(config.JWT_SECRET);
  const ga4PropertyId = readString(config.GA4_PROPERTY_ID);
  const googleApplicationCredentials = readString(
    config.GOOGLE_APPLICATION_CREDENTIALS,
  );
  const ga4ApiTimeoutMs = readString(config.GA4_API_TIMEOUT_MS);
  const ga4RealtimeCacheSeconds = readString(config.GA4_REALTIME_CACHE_SECONDS);
  const ga4HistoricalCacheSeconds = readString(
    config.GA4_HISTORICAL_CACHE_SECONDS,
  );

  if (!validNodeEnvironments.has(nodeEnv)) {
    throw new Error('NODE_ENV must be development, production, or test');
  }

  if (port && !isValidPort(port)) {
    throw new Error('PORT must be a number between 1 and 65535');
  }

  if (nodeEnv !== 'test' && !databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  if (nodeEnv !== 'test' && !adminUsername) {
    throw new Error('ADMIN_USERNAME is required');
  }

  if (nodeEnv !== 'test' && !adminPasswordHash) {
    throw new Error('ADMIN_PASSWORD_HASH is required');
  }

  if (nodeEnv !== 'test' && !jwtSecret) {
    throw new Error('JWT_SECRET is required');
  }

  if (maxApkUploadBytes && !isPositiveInteger(maxApkUploadBytes)) {
    throw new Error('MAX_APK_UPLOAD_BYTES must be a positive integer');
  }

  if (nodeEnv === 'production' && !ga4PropertyId) {
    throw new Error('GA4_PROPERTY_ID is required in production');
  }

  if (nodeEnv === 'production' && !googleApplicationCredentials) {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS is required in production');
  }

  if (ga4ApiTimeoutMs && !isPositiveInteger(ga4ApiTimeoutMs)) {
    throw new Error('GA4_API_TIMEOUT_MS must be a positive integer');
  }

  if (ga4RealtimeCacheSeconds && !isPositiveInteger(ga4RealtimeCacheSeconds)) {
    throw new Error('GA4_REALTIME_CACHE_SECONDS must be a positive integer');
  }

  if (
    ga4HistoricalCacheSeconds &&
    !isPositiveInteger(ga4HistoricalCacheSeconds)
  ) {
    throw new Error('GA4_HISTORICAL_CACHE_SECONDS must be a positive integer');
  }

  return config;
}

function readString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function isValidPort(value: string) {
  const port = Number(value);
  return Number.isInteger(port) && port > 0 && port <= 65535;
}

function isPositiveInteger(value: string) {
  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) && parsedValue > 0;
}
