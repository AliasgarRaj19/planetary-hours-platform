import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from './config/app.config';
import { analyticsConfig } from './config/analytics.config';
import { authConfig } from './config/auth.config';
import { databaseConfig } from './config/database.config';
import { validateEnvironment } from './config/env.validation';
import { AppDistributionModule } from './app-distribution/app-distribution.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { BlogModule } from './blog/blog.module';
import { PlanetaryHoursModule } from './planetary-hours/planetary-hours.module';
import { SitemapModule } from './sitemap/sitemap.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, analyticsConfig, authConfig, databaseConfig],
      validate: validateEnvironment,
    }),
    AnalyticsModule,
    AuditModule,
    AppDistributionModule,
    AuthModule,
    BlogModule,
    HealthModule,
    PlanetaryHoursModule,
    SitemapModule,
  ],
})
export class AppModule {}
