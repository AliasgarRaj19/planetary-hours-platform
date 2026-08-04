const validNodeEnvironments = new Set(['development', 'production', 'test']);

export function validateEnvironment(config: Record<string, unknown>) {
  const nodeEnv = readString(config.NODE_ENV) ?? 'development';
  const port = readString(config.PORT);
  const databaseUrl = readString(config.DATABASE_URL);
  const adminPasswordHash = readString(config.ADMIN_PASSWORD_HASH);
  const adminUsername = readString(config.ADMIN_USERNAME);
  const maxApkUploadBytes = readString(config.MAX_APK_UPLOAD_BYTES);
  const jwtSecret = readString(config.JWT_SECRET);

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
