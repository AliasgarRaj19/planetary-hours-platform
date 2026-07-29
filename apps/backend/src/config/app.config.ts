import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGIN),
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
