import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from './config/app.config';
import { authConfig } from './config/auth.config';
import { databaseConfig } from './config/database.config';
import { validateEnvironment } from './config/env.validation';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { PlanetaryHoursModule } from './planetary-hours/planetary-hours.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, authConfig, databaseConfig],
      validate: validateEnvironment,
    }),
    AuthModule,
    HealthModule,
    PlanetaryHoursModule,
  ],
})
export class AppModule {}
