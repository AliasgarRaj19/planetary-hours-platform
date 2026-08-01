import {
  getDateKeyInTimezone,
  type PlanetaryHourScheduleRow,
} from '@planetary-hours/planetary-engine';
import type {
  WebsitePlanetaryHourContent,
  WebsitePlanetaryHourRow,
} from '../types/planetaryHoursContent';

export function mergeScheduleWithContent(
  schedule: PlanetaryHourScheduleRow[],
  content: WebsitePlanetaryHourContent[] | undefined,
): WebsitePlanetaryHourRow[] {
  return schedule.map((hour) => {
    const matchingContent = content?.find((item) => item.hourNumber === hour.hour);

    return {
      ...hour,
      description: matchingContent?.description ?? '',
      suggestion: matchingContent?.suggestion ?? '',
    };
  });
}

export function getBackendDayOfWeek(date: Date, timezone: string) {
  const dateKey = getDateKeyInTimezone(date, timezone);
  const weekday = new Date(`${dateKey}T12:00:00.000Z`).getUTCDay();

  return weekday === 0 ? 7 : weekday;
}

export function uniqueNumbers(values: number[]) {
  return Array.from(new Set(values));
}
