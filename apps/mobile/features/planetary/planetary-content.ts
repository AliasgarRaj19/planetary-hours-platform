import type { PlanetaryHourScheduleRow } from '@planetary-hours/planetary-engine';
import { getDateKeyInTimezone } from '@planetary-hours/planetary-engine';
import type { PlanetaryHourContent } from '@/src/api/planetary-hours';

export type PlanetaryHourContentState = 'idle' | 'loading' | 'unavailable';

export type PlanetaryHourWithContent = PlanetaryHourScheduleRow & {
  description?: string;
  suggestion?: string;
};

export type PlanetaryHourContentByDay = Partial<Record<number, PlanetaryHourContent[]>>;

export function mergePlanetaryHourContent(
  schedule: PlanetaryHourScheduleRow[],
  content: PlanetaryHourContent[] | undefined,
): PlanetaryHourWithContent[] {
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
