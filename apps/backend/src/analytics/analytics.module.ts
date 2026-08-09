import { Module } from '@nestjs/common';
import { AdminAnalyticsController } from './admin-analytics.controller';
import { AnalyticsCacheService } from './analytics-cache.service';
import { AnalyticsService } from './analytics.service';
import { GoogleAnalyticsDataService } from './google-analytics-data.service';

@Module({
  controllers: [AdminAnalyticsController],
  providers: [
    AnalyticsCacheService,
    AnalyticsService,
    GoogleAnalyticsDataService,
  ],
})
export class AnalyticsModule {}
