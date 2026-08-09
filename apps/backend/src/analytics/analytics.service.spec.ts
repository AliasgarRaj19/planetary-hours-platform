import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AnalyticsCacheService } from './analytics-cache.service';
import { AnalyticsService } from './analytics.service';
import { GoogleAnalyticsDataService } from './google-analytics-data.service';

describe('AnalyticsService', () => {
  let cache: AnalyticsCacheService;
  let googleAnalytics: jest.Mocked<GoogleAnalyticsDataService>;
  let service: AnalyticsService;

  beforeEach(() => {
    cache = new AnalyticsCacheService();
    googleAnalytics = {
      runRealtimeReport: jest.fn(),
      runReport: jest.fn(),
    } as unknown as jest.Mocked<GoogleAnalyticsDataService>;
    service = new AnalyticsService(
      cache,
      {
        get: jest.fn((key: string, fallback: number) => fallback),
      } as unknown as ConfigService,
      googleAnalytics,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('maps realtime active users, pages, and events', async () => {
    googleAnalytics.runRealtimeReport
      .mockResolvedValueOnce(report([metricRow([], ['3'])]))
      .mockResolvedValueOnce(
        report([
          metricRow(['/schedule', 'Schedule Table'], ['2', '5']),
          metricRow(['/blog', 'Blog'], ['1', '3']),
        ]),
      )
      .mockResolvedValueOnce(
        report([
          metricRow(['app_download_click'], ['4']),
          metricRow(['blog_article_view'], ['6']),
        ]),
      );

    await expect(service.getRealtime()).resolves.toMatchObject({
      activeUsers: 3,
      recentViews: 8,
      recentEvents: 10,
      activePages: [
        { path: '/schedule', title: 'Schedule Table', activeUsers: 2 },
        { path: '/blog', title: 'Blog', activeUsers: 1 },
      ],
      events: [
        { eventName: 'app_download_click', count: 4 },
        { eventName: 'blog_article_view', count: 6 },
      ],
    });
  });

  it('maps overview report metrics', async () => {
    googleAnalytics.runReport.mockResolvedValueOnce(
      report([metricRow([], ['10', '7', '25', '0.5', '140'])]),
    );

    await expect(service.getOverview('7d')).resolves.toMatchObject({
      range: '7d',
      users: 10,
      sessions: 7,
      views: 25,
      engagementRate: 0.5,
      averageEngagementTimeSeconds: 20,
    });
  });

  it('maps pages report rows', async () => {
    googleAnalytics.runReport.mockResolvedValueOnce(
      report([metricRow(['/schedule', 'Schedule Table'], ['12', '8'])]),
    );

    await expect(service.getPages('30d')).resolves.toMatchObject({
      range: '30d',
      items: [
        {
          path: '/schedule',
          title: 'Schedule Table',
          views: 12,
          users: 8,
        },
      ],
    });
  });

  it('maps custom event totals and top events', async () => {
    googleAnalytics.runReport.mockResolvedValueOnce(
      report([
        metricRow(['app_download_click'], ['3']),
        metricRow(['schedule_date_change'], ['5']),
        metricRow(['blog_article_view'], ['7']),
        metricRow(['blog_category_select'], ['11']),
      ]),
    );

    await expect(service.getEvents('today')).resolves.toMatchObject({
      customEvents: {
        appDownloadClicks: 3,
        scheduleDateChanges: 5,
        blogArticleViews: 7,
        blogCategorySelections: 11,
      },
    });
  });

  it('maps traffic reports', async () => {
    googleAnalytics.runReport
      .mockResolvedValueOnce(
        report([metricRow(['google / organic'], ['9', '6'])]),
      )
      .mockResolvedValueOnce(report([metricRow(['India'], ['8'])]))
      .mockResolvedValueOnce(report([metricRow(['mobile'], ['7'])]));

    await expect(service.getTraffic('yesterday')).resolves.toMatchObject({
      sources: [{ sourceMedium: 'google / organic', users: 9, sessions: 6 }],
      countries: [{ country: 'India', users: 8 }],
      devices: [{ deviceCategory: 'mobile', users: 7 }],
    });
  });

  it('caches report responses by key', async () => {
    googleAnalytics.runReport.mockResolvedValue(
      report([metricRow([], ['1', '1', '1', '1', '1'])]),
    );

    await service.getOverview('7d');
    await service.getOverview('7d');

    expect(googleAnalytics.runReport.mock.calls).toHaveLength(1);
  });

  it('returns stale cached data when Google Analytics temporarily fails', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(0);
    cache.set(
      'overview:7d',
      {
        range: '7d',
        users: 1,
        sessions: 1,
        views: 1,
        engagementRate: 1,
        averageEngagementTimeSeconds: 1,
        refreshedAt: '2026-01-01T00:00:00.000Z',
      },
      1,
    );
    jest.spyOn(Date, 'now').mockReturnValue(1500);
    googleAnalytics.runReport.mockRejectedValue(
      new Error('private key failed'),
    );

    await expect(service.getOverview('7d')).resolves.toMatchObject({
      users: 1,
    });
  });

  it('returns controlled errors without leaking Google credential details', async () => {
    googleAnalytics.runReport.mockRejectedValue(
      new Error('private_key secret'),
    );

    try {
      await service.getOverview('7d');
      throw new Error('Expected analytics request to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(ServiceUnavailableException);
      expect(error instanceof Error ? error.message : '').not.toContain(
        'private_key',
      );
    }
  });
});

function report(rows: Array<Record<string, unknown>>) {
  return { rows };
}

function metricRow(dimensions: string[], metrics: string[]) {
  return {
    dimensionValues: dimensions.map((value) => ({ value })),
    metricValues: metrics.map((value) => ({ value })),
  };
}
