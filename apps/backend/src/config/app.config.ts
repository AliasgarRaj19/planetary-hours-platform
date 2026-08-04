import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGIN),
  downloadStoragePath:
    process.env.DOWNLOAD_STORAGE_PATH ?? '/app/storage/downloads',
  maxApkUploadBytes: parsePositiveInteger(
    process.env.MAX_APK_UPLOAD_BYTES,
    200 * 1024 * 1024,
  ),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parsePort(process.env.PORT),
}));

function parsePort(value: string | undefined) {
  if (!value) {
    return 3000;
  }

  return Number(value);
}

function parseCorsOrigins(value: string | undefined) {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallback;
}
