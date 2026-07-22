import { describe, expect, it } from 'vitest';
import { generatePlanetaryHoursSchedule } from '@planetary-hours/planetary-engine';
import {
  calculateTimeRemaining,
  calculateCountdownToHourEnd,
  findCurrentPlanetaryHour,
  findNextPlanetaryHour,
  formatCountdown,
  getVisiblePlanetaryHours,
} from '@planetary-hours/planetary-engine';

function buildSchedules() {
  const yesterdaySchedule = generatePlanetaryHoursSchedule({
    sunriseTime: '2026-07-18T06:00:00.000Z',
    sunsetTime: '2026-07-18T18:00:00.000Z',
    nextSunriseTime: '2026-07-19T06:00:00.000Z',
    date: '2026-07-18T06:00:00.000Z',
    timezone: 'UTC',
  }).schedule;
  const todaySchedule = generatePlanetaryHoursSchedule({
    sunriseTime: '2026-07-19T06:00:00.000Z',
    sunsetTime: '2026-07-19T18:00:00.000Z',
    nextSunriseTime: '2026-07-20T06:00:00.000Z',
    date: '2026-07-19T06:00:00.000Z',
    timezone: 'UTC',
  }).schedule;
  const tomorrowSchedule = generatePlanetaryHoursSchedule({
    sunriseTime: '2026-07-20T06:00:00.000Z',
    sunsetTime: '2026-07-20T18:00:00.000Z',
    nextSunriseTime: '2026-07-21T06:00:00.000Z',
    date: '2026-07-20T06:00:00.000Z',
    timezone: 'UTC',
  }).schedule;

  return { yesterdaySchedule, todaySchedule, tomorrowSchedule };
}

describe('planetary hour selectors', () => {
  const schedules = buildSchedules();
  const completeSchedule = [
    ...schedules.yesterdaySchedule,
    ...schedules.todaySchedule,
    ...schedules.tomorrowSchedule,
  ];
  const sunBoundaries = {
    yesterday: {
      sunrise: new Date('2026-07-18T06:00:00.000Z'),
      sunset: new Date('2026-07-18T18:00:00.000Z'),
    },
    today: {
      sunrise: new Date('2026-07-19T06:00:00.000Z'),
      sunset: new Date('2026-07-19T18:00:00.000Z'),
    },
    tomorrow: {
      sunrise: new Date('2026-07-20T06:00:00.000Z'),
      sunset: new Date('2026-07-20T18:00:00.000Z'),
    },
  };

  it.each([
    ['one second before sunrise', '2026-07-19T05:59:59.000Z', 24],
    ['exactly at sunrise', '2026-07-19T06:00:00.000Z', 1],
    ['one second after sunrise', '2026-07-19T06:00:01.000Z', 1],
    ['one second before sunset', '2026-07-19T17:59:59.000Z', 12],
    ['exactly at sunset', '2026-07-19T18:00:00.000Z', 13],
    ['one second after sunset', '2026-07-19T18:00:01.000Z', 13],
    ['one second before an hour ends', '2026-07-19T06:59:59.000Z', 1],
    ['exactly at next hour start', '2026-07-19T07:00:00.000Z', 2],
    ['just before midnight', '2026-07-19T23:59:59.000Z', 18],
    ['exactly at midnight', '2026-07-20T00:00:00.000Z', 19],
    ['just after midnight', '2026-07-20T00:00:01.000Z', 19],
    ['one second before following sunrise', '2026-07-20T05:59:59.000Z', 24],
  ])('selects only one active hour at %s', (_case, nowValue, expectedHour) => {
    const now = new Date(nowValue);
    const activeMatches = completeSchedule.filter(
      (hour) => hour.startTime.getTime() <= now.getTime() && now.getTime() < hour.endTime.getTime(),
    );

    expect(activeMatches).toHaveLength(1);
    expect(findCurrentPlanetaryHour(completeSchedule, now)?.hour).toBe(expectedHour);
  });

  it('selects the previous night schedule before sunrise', () => {
    const visible = getVisiblePlanetaryHours(
      schedules,
      sunBoundaries,
      new Date('2026-07-19T05:30:00.000Z'),
    );

    expect(visible.period).toBe('night-before-sunrise');
    expect(visible.hours).toHaveLength(12);
    expect(visible.hours[0].hour).toBe(13);
    expect(visible.hours[11].hour).toBe(24);
    expect(visible.hours[0].startTime.getTime()).toBe(
      schedules.yesterdaySchedule[12].startTime.getTime(),
    );
  });

  it('selects day and night visible tables with exactly 12 rows', () => {
    const day = getVisiblePlanetaryHours(schedules, sunBoundaries, new Date('2026-07-19T12:00:00.000Z'));
    const night = getVisiblePlanetaryHours(schedules, sunBoundaries, new Date('2026-07-19T20:00:00.000Z'));

    expect(day.title).toBe("Today's Daytime Planetary Hours");
    expect(day.hours.map((hour) => hour.hour)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(night.title).toBe("Tonight's Planetary Hours");
    expect(night.hours.map((hour) => hour.hour)).toEqual([13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]);
  });

  it('selects next hours across key transitions', () => {
    expect(findNextPlanetaryHour(completeSchedule, schedules.todaySchedule[0], new Date('2026-07-19T06:30:00.000Z'))?.hour).toBe(2);
    expect(findNextPlanetaryHour(completeSchedule, schedules.todaySchedule[11], new Date('2026-07-19T17:30:00.000Z'))?.hour).toBe(13);
    expect(findNextPlanetaryHour(completeSchedule, schedules.todaySchedule[22], new Date('2026-07-20T04:30:00.000Z'))?.hour).toBe(24);
    expect(findNextPlanetaryHour(completeSchedule, schedules.todaySchedule[23], new Date('2026-07-20T05:30:00.000Z'))?.hour).toBe(1);
  });

  it('calculates and formats non-negative countdowns', () => {
    const current = findCurrentPlanetaryHour(
      completeSchedule,
      new Date('2026-07-19T06:21:46.000Z'),
    );

    expect(formatCountdown(calculateTimeRemaining(current, new Date('2026-07-19T06:21:46.000Z')))).toBe('00:38:14');
    expect(formatCountdown(calculateTimeRemaining(current, new Date('2026-07-19T08:00:00.000Z')))).toBe('00:00:00');
  });

  it('selects the next hour immediately after a boundary with non-zero seconds', () => {
    const schedule = generatePlanetaryHoursSchedule({
      sunriseTime: '2026-07-19T06:00:40.000Z',
      sunsetTime: '2026-07-19T18:00:40.000Z',
      nextSunriseTime: '2026-07-20T06:00:40.000Z',
      date: '2026-07-19T06:00:40.000Z',
      timezone: 'UTC',
    }).schedule;

    expect(findCurrentPlanetaryHour(schedule, new Date('2026-07-19T07:00:39.999Z'))?.hour).toBe(1);
    expect(findCurrentPlanetaryHour(schedule, new Date('2026-07-19T07:00:40.000Z'))?.hour).toBe(2);
  });

  it('counts down against the exact stored end boundary', () => {
    const current = {
      endTime: new Date('2026-07-19T07:00:40.000Z'),
      hour: 1,
      planet: 'Sun' as const,
      startTime: new Date('2026-07-19T06:00:40.000Z'),
    };

    expect(calculateCountdownToHourEnd(current, new Date('2026-07-19T07:00:39.000Z').getTime())).toBe(1000);
    expect(calculateCountdownToHourEnd(current, new Date('2026-07-19T07:00:40.000Z').getTime())).toBe(0);
    expect(calculateCountdownToHourEnd(current, new Date('2026-07-19T07:00:41.000Z').getTime())).toBe(0);
  });
});
