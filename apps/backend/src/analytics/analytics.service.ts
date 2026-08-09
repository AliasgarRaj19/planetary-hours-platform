import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AnalyticsCacheService } from './analytics-cache.service';
import type { AnalyticsRange } from './dto/analytics-range.dto';
import {
  GoogleAnalyticsDataService,
  type AnalyticsRealtimeReportResponse,
  type AnalyticsReportResponse,
} from './google-analytics-data.service';

type CustomEventName =
  | 'app_download_click'
  | 'schedule_date_change'
  | 'blog_article_view'
  | 'blog_category_select';

type MetricValue = { value?: string | null };
type DimensionValue = { value?: string | null };
type ReportRow = {
  dimensionValues?: DimensionValue[] | null;
  metricValues?: MetricValue[] | null;
};

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly cache: AnalyticsCacheService,
    private readonly configService: ConfigService,
    private readonly googleAnalytics: GoogleAnalyticsDataService,
  ) {}

  getRealtime() {
    return this.cached('realtime', this.realtimeCacheSeconds, async () => {
      const [activeUsersReport, pageReport, eventReport] = await Promise.all([
        this.googleAnalytics.runRealtimeReport({
          metrics: [{ name: 'activeUsers' }],
        }),
        this.googleAnalytics.runRealtimeReport({
          dimensions: [
            { name: 'unifiedPagePathScreen' },
            { name: 'unifiedScreenName' },
          ],
          metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }],
          limit: 10,
        }),
        this.googleAnalytics.runRealtimeReport({
          dimensions: [{ name: 'eventName' }],
          metrics: [{ name: 'eventCount' }],
          limit: 20,
        }),
      ]);
      const activePages = rows(pageReport).map((row) => ({
        path: readDimension(row, 0) || '/',
        title: readDimension(row, 1) || null,
        activeUsers: readNumberMetric(row, 0),
      }));
      const events = rows(eventReport).map((row) => ({
        eventName: readDimension(row, 0) || '(not set)',
        count: readNumberMetric(row, 0),
      }));

      return {
        activeUsers: sumMetric(activeUsersReport, 0),
        recentViews: activePages.reduce(
          (total, _page, index) =>
            total + readNumberMetric(rows(pageReport)[index], 1),
          0,
        ),
        recentEvents: events.reduce((total, event) => total + event.count, 0),
        activePages,
        events,
        refreshedAt: new Date().toISOString(),
      };
    });
  }

  getOverview(range: AnalyticsRange) {
    return this.cached(
      `overview:${range}`,
      this.historicalCacheSeconds,
      async () => {
        const response = await this.googleAnalytics.runReport({
          dateRanges: [toDateRange(range)],
          metrics: [
            { name: 'activeUsers' },
            { name: 'sessions' },
            { name: 'screenPageViews' },
            { name: 'engagementRate' },
            { name: 'userEngagementDuration' },
          ],
        });
        const row = rows(response)[0];
        const sessions = readNumberMetric(row, 1);
        const totalEngagementSeconds = readNumberMetric(row, 4);

        return {
          range,
          users: readNumberMetric(row, 0),
          sessions,
          views: readNumberMetric(row, 2),
          engagementRate: readNullableNumberMetric(row, 3),
          averageEngagementTimeSeconds:
            sessions > 0 ? totalEngagementSeconds / sessions : null,
          refreshedAt: new Date().toISOString(),
        };
      },
    );
  }

  getPages(range: AnalyticsRange) {
    return this.cached(
      `pages:${range}`,
      this.historicalCacheSeconds,
      async () => {
        const response = await this.googleAnalytics.runReport({
          dateRanges: [toDateRange(range)],
          dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
          metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
          limit: 25,
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        });

        return {
          range,
          items: rows(response).map((row) => ({
            path: readDimension(row, 0) || '/',
            title: readDimension(row, 1) || null,
            views: readNumberMetric(row, 0),
            users: readNumberMetric(row, 1),
          })),
          refreshedAt: new Date().toISOString(),
        };
      },
    );
  }

  getEvents(range: AnalyticsRange) {
    return this.cached(
      `events:${range}`,
      this.historicalCacheSeconds,
      async () => {
        const response = await this.googleAnalytics.runReport({
          dateRanges: [toDateRange(range)],
          dimensions: [{ name: 'eventName' }],
          metrics: [{ name: 'eventCount' }],
          limit: 50,
          orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
        });
        const topEvents = rows(response).map((row) => ({
          eventName: readDimension(row, 0) || '(not set)',
          count: readNumberMetric(row, 0),
        }));

        return {
          range,
          customEvents: {
            appDownloadClicks: findEventCount(topEvents, 'app_download_click'),
            scheduleDateChanges: findEventCount(
              topEvents,
              'schedule_date_change',
            ),
            blogArticleViews: findEventCount(topEvents, 'blog_article_view'),
            blogCategorySelections: findEventCount(
              topEvents,
              'blog_category_select',
            ),
          },
          topEvents,
          refreshedAt: new Date().toISOString(),
        };
      },
    );
  }

  getTraffic(range: AnalyticsRange) {
    return this.cached(
      `traffic:${range}`,
      this.historicalCacheSeconds,
      async () => {
        const [sourcesReport, countriesReport, devicesReport] =
          await Promise.all([
            this.googleAnalytics.runReport({
              dateRanges: [toDateRange(range)],
              dimensions: [{ name: 'sessionSourceMedium' }],
              metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
              limit: 15,
              orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
            }),
            this.googleAnalytics.runReport({
              dateRanges: [toDateRange(range)],
              dimensions: [{ name: 'country' }],
              metrics: [{ name: 'activeUsers' }],
              limit: 15,
              orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
            }),
            this.googleAnalytics.runReport({
              dateRanges: [toDateRange(range)],
              dimensions: [{ name: 'deviceCategory' }],
              metrics: [{ name: 'activeUsers' }],
              limit: 10,
              orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
            }),
          ]);

        return {
          range,
          sources: rows(sourcesReport).map((row) => ({
            sourceMedium: readDimension(row, 0) || '(not set)',
            users: readNumberMetric(row, 0),
            sessions: readNumberMetric(row, 1),
          })),
          countries: rows(countriesReport).map((row) => ({
            country: readDimension(row, 0) || '(not set)',
            users: readNumberMetric(row, 0),
          })),
          devices: rows(devicesReport).map((row) => ({
            deviceCategory: readDimension(row, 0) || '(not set)',
            users: readNumberMetric(row, 0),
          })),
          refreshedAt: new Date().toISOString(),
        };
      },
    );
  }

  private async cached<T>(
    key: string,
    ttlSeconds: number,
    loader: () => Promise<T>,
  ) {
    const cached = this.cache.get<T>(key);

    if (cached) {
      return cached;
    }

    try {
      const response = await loader();
      this.cache.set(key, response, ttlSeconds);
      return response;
    } catch {
      const stale = this.cache.getStale<T>(key);

      if (stale) {
        return stale;
      }

      throw new ServiceUnavailableException(
        'Analytics data is unavailable right now',
      );
    }
  }

  private get realtimeCacheSeconds() {
    return this.configService.get<number>('analytics.realtimeCacheSeconds', 30);
  }

  private get historicalCacheSeconds() {
    return this.configService.get<number>(
      'analytics.historicalCacheSeconds',
      900,
    );
  }
}

function toDateRange(range: AnalyticsRange) {
  if (range === 'today') {
    return { startDate: 'today', endDate: 'today' };
  }

  if (range === 'yesterday') {
    return { startDate: 'yesterday', endDate: 'yesterday' };
  }

  if (range === '30d') {
    return { startDate: '30daysAgo', endDate: 'today' };
  }

  return { startDate: '7daysAgo', endDate: 'today' };
}

function rows(
  response: AnalyticsReportResponse | AnalyticsRealtimeReportResponse,
): ReportRow[] {
  return response.rows ?? [];
}

function readDimension(row: ReportRow | undefined, index: number) {
  return row?.dimensionValues?.[index]?.value?.trim() ?? '';
}

function readNumberMetric(row: ReportRow | undefined, index: number) {
  return Number(row?.metricValues?.[index]?.value ?? 0);
}

function readNullableNumberMetric(row: ReportRow | undefined, index: number) {
  const value = row?.metricValues?.[index]?.value;
  return value === undefined || value === null ? null : Number(value);
}

function sumMetric(
  response: AnalyticsReportResponse | AnalyticsRealtimeReportResponse,
  metricIndex: number,
) {
  return rows(response).reduce(
    (total, row) => total + readNumberMetric(row, metricIndex),
    0,
  );
}

function findEventCount(
  events: Array<{ eventName: string; count: number }>,
  eventName: CustomEventName,
) {
  return events.find((event) => event.eventName === eventName)?.count ?? 0;
}
