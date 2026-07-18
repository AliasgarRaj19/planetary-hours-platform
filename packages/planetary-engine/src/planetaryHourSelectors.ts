import type { PlanetaryHourScheduleRow } from './planetaryHoursEngine';

export type PlanetaryHourSummary = {
  currentHour: PlanetaryHourScheduleRow | null;
  nextHour: PlanetaryHourScheduleRow | null;
  timeRemainingMilliseconds: number | null;
};

export type PlanetaryScheduleSet = {
  yesterdaySchedule: PlanetaryHourScheduleRow[];
  todaySchedule: PlanetaryHourScheduleRow[];
  tomorrowSchedule: PlanetaryHourScheduleRow[];
};

export type SunBoundarySet = {
  yesterday: {
    sunrise: Date;
    sunset: Date;
  };
  today: {
    sunrise: Date;
    sunset: Date;
  };
  tomorrow: {
    sunrise: Date;
    sunset: Date;
  };
};

export function findCurrentPlanetaryHour(
  schedule: PlanetaryHourScheduleRow[],
  now: Date,
) {
  return (
    schedule.find(
      (hour) => hour.startTime.getTime() <= now.getTime() && now.getTime() < hour.endTime.getTime(),
    ) ?? null
  );
}

export function findNextPlanetaryHour(
  schedule: PlanetaryHourScheduleRow[],
  currentHour: PlanetaryHourScheduleRow | null,
  now: Date,
) {
  const sortedSchedule = [...schedule].sort(
    (first, second) => first.startTime.getTime() - second.startTime.getTime(),
  );

  if (!currentHour) {
    return (
      sortedSchedule.find((hour) => hour.startTime.getTime() > now.getTime()) ?? null
    );
  }

  return (
    sortedSchedule.find(
      (hour) => hour.startTime.getTime() >= currentHour.endTime.getTime(),
    ) ?? null
  );
}

export function calculateTimeRemaining(
  currentHour: PlanetaryHourScheduleRow | null,
  now: Date,
) {
  if (!currentHour) {
    return null;
  }

  return Math.max(0, currentHour.endTime.getTime() - now.getTime());
}

export function buildPlanetaryHourSummary(
  schedule: PlanetaryHourScheduleRow[],
  now: Date,
): PlanetaryHourSummary {
  const currentHour = findCurrentPlanetaryHour(schedule, now);
  const nextHour = findNextPlanetaryHour(schedule, currentHour, now);

  return {
    currentHour,
    nextHour,
    timeRemainingMilliseconds: calculateTimeRemaining(currentHour, now),
  };
}

export function formatCountdown(milliseconds: number | null) {
  if (milliseconds === null) {
    return '--:--:--';
  }

  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
}

export function getVisiblePlanetaryHours(
  schedules: PlanetaryScheduleSet,
  sunBoundaries: SunBoundarySet,
  now: Date,
) {
  if (now >= sunBoundaries.today.sunrise && now < sunBoundaries.today.sunset) {
    return {
      title: "Today's Daytime Planetary Hours",
      hours: schedules.todaySchedule.slice(0, 12),
      period: 'day' as const,
    };
  }

  if (now >= sunBoundaries.today.sunset) {
    return {
      title: "Tonight's Planetary Hours",
      hours: schedules.todaySchedule.slice(12, 24),
      period: 'night' as const,
    };
  }

  return {
    title: "Tonight's Planetary Hours",
    hours: schedules.yesterdaySchedule.slice(12, 24),
    period: 'night-before-sunrise' as const,
  };
}
