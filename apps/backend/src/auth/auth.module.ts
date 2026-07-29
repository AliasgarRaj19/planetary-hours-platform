import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { StringValue } from 'ms';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AdminJwtGuard } from './admin-jwt.guard';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('auth.jwtSecret'),
        signOptions: {
          expiresIn: getJwtExpiresIn(configService),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AdminJwtGuard, AuthService, JwtStrategy],
  exports: [AdminJwtGuard, AuthService],
})
export class AuthModule {}

function getJwtExpiresIn(configService: ConfigService) {
  const value = configService.get<string>('auth.jwtExpiresIn') ?? '1h';
  const numericValue = Number(value);

  if (Number.isInteger(numericValue) && numericValue > 0) {
    return numericValue;
  }

  return value as StringValue;
}
