import {
  buildDayNightInfo as buildSharedDayNightInfo,
  calculateDayNightSunData,
  type DayNightInfo,
  type DayNightSunData,
  type SunTimes,
} from '@planetary-hours/planetary-engine';
import type { SelectedLocation } from './locationService';

export type { DayNightInfo, DayNightSunData, SunTimes };

export async function fetchDayNightSunData(
  location: SelectedLocation,
  now: Date,
  _signal?: AbortSignal,
): Promise<DayNightSunData> {
  if (!location.timezone) {
    throw new Error('Timezone is unavailable for the selected location');
  }

  return calculateDayNightSunData({
    coordinates: {
      latitude: location.latitude,
      longitude: location.longitude,
    },
    now,
    timezone: location.timezone,
  });
}

export function buildDayNightInfo(
  location: SelectedLocation,
  now: Date,
  sunData: DayNightSunData,
): DayNightInfo {
  return buildSharedDayNightInfo({
    now,
    sunData,
    timezone: location.timezone,
  });
}
