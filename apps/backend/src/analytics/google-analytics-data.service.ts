import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import type { protos } from '@google-analytics/data';

export type RunReportRequest =
  protos.google.analytics.data.v1beta.IRunReportRequest;
export type RunRealtimeReportRequest =
  protos.google.analytics.data.v1beta.IRunRealtimeReportRequest;
export type AnalyticsReportResponse =
  protos.google.analytics.data.v1beta.IRunReportResponse;
export type AnalyticsRealtimeReportResponse =
  protos.google.analytics.data.v1beta.IRunRealtimeReportResponse;

@Injectable()
export class GoogleAnalyticsDataService {
  private readonly client = new BetaAnalyticsDataClient();

  constructor(private readonly configService: ConfigService) {}

  async runReport(
    request: Omit<RunReportRequest, 'property'>,
  ): Promise<AnalyticsReportResponse> {
    return this.withTimeout(
      this.client.runReport({
        property: this.propertyName,
        ...request,
      }),
    );
  }

  async runRealtimeReport(
    request: Omit<RunRealtimeReportRequest, 'property'>,
  ): Promise<AnalyticsRealtimeReportResponse> {
    return this.withTimeout(
      this.client.runRealtimeReport({
        property: this.propertyName,
        ...request,
      }),
    );
  }

  private get propertyName() {
    const propertyId = this.configService.getOrThrow<string>(
      'analytics.propertyId',
    );
    return `properties/${propertyId}`;
  }

  private async withTimeout<T>(promise: Promise<[T, ...unknown[]]>) {
    const timeoutMs = this.configService.get<number>(
      'analytics.apiTimeoutMs',
      8000,
    );
    let timeout: NodeJS.Timeout | undefined;

    try {
      const [response] = await Promise.race([
        promise,
        new Promise<never>((_, reject) => {
          timeout = setTimeout(
            () => reject(new Error('Google Analytics request timed out')),
            timeoutMs,
          );
        }),
      ]);

      return response;
    } catch {
      throw new ServiceUnavailableException(
        'Analytics data is unavailable right now',
      );
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  }
}
