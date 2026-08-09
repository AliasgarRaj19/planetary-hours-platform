import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';
import { AnalyticsService } from './analytics.service';
import {
  AnalyticsRangeDto,
  type AnalyticsRange,
} from './dto/analytics-range.dto';

@Controller('admin/analytics')
@UseGuards(AdminJwtGuard)
export class AdminAnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('realtime')
  getRealtime() {
    return this.analyticsService.getRealtime();
  }

  @Get('overview')
  getOverview(@Query() query: AnalyticsRangeDto) {
    return this.analyticsService.getOverview(resolveRange(query.range));
  }

  @Get('pages')
  getPages(@Query() query: AnalyticsRangeDto) {
    return this.analyticsService.getPages(resolveRange(query.range));
  }

  @Get('events')
  getEvents(@Query() query: AnalyticsRangeDto) {
    return this.analyticsService.getEvents(resolveRange(query.range));
  }

  @Get('traffic')
  getTraffic(@Query() query: AnalyticsRangeDto) {
    return this.analyticsService.getTraffic(resolveRange(query.range));
  }
}

function resolveRange(range: AnalyticsRange | undefined): AnalyticsRange {
  return range ?? '7d';
}
