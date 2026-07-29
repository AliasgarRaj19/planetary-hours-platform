import { registerAs } from '@nestjs/config';

export const authConfig = registerAs('auth', () => ({
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH ?? '',
  adminUsername: process.env.ADMIN_USERNAME ?? '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
  jwtSecret: process.env.JWT_SECRET ?? '',
}));
