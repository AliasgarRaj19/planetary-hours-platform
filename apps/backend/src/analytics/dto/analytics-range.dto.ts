import { IsIn, IsOptional } from 'class-validator';

export const analyticsRanges = ['today', 'yesterday', '7d', '30d'] as const;
export type AnalyticsRange = (typeof analyticsRanges)[number];

export class AnalyticsRangeDto {
  @IsOptional()
  @IsIn(analyticsRanges)
  range?: AnalyticsRange;
}
