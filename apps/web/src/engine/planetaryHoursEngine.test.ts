import { describe, expect, it } from 'vitest';
import { generatePlanetaryHoursSchedule } from '@planetary-hours/planetary-engine';

const chaldeanOrder = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'];

describe('planetary hours engine', () => {
  it('generates exact day and night boundaries with no gaps or overlaps', () => {
    const sunrise = new Date('2026-07-19T06:13:17.000Z');
    const sunset = new Date('2026-07-19T19:41:59.000Z');
    const nextSunrise = new Date('2026-07-20T06:14:01.000Z');

    const result = generatePlanetaryHoursSchedule({
      sunriseTime: sunrise,
      sunsetTime: sunset,
      nextSunriseTime: nextSunrise,
      date: sunrise,
      timezone: 'UTC',
    });

    expect(result.schedule).toHaveLength(24);
    expect(result.schedule[0].startTime.getTime()).toBe(sunrise.getTime());
    expect(result.schedule[11].endTime.getTime()).toBe(sunset.getTime());
    expect(result.schedule[12].startTime.getTime()).toBe(sunset.getTime());
    expect(result.schedule[23].endTime.getTime()).toBe(nextSunrise.getTime());

    result.schedule.slice(0, -1).forEach((hour, index) => {
      expect(hour.endTime.getTime()).toBe(result.schedule[index + 1].startTime.getTime());
      expect(hour.endTime.getTime()).toBeGreaterThan(hour.startTime.getTime());
    });
  });

  it('divides day and night into 12 equal planetary-hour durations', () => {
    const result = generatePlanetaryHoursSchedule({
      sunriseTime: '2026-01-15T01:10:00.000Z',
      sunsetTime: '2026-01-15T12:10:00.000Z',
      nextSunriseTime: '2026-01-16T01:22:00.000Z',
      date: '2026-01-15T01:10:00.000Z',
      timezone: 'Asia/Kolkata',
    });

    expect(result.daytimeDuration.milliseconds).toBe(11 * 60 * 60 * 1000);
    expect(result.nighttimeDuration.milliseconds).toBe(13 * 60 * 60 * 1000 + 12 * 60 * 1000);
    expect(result.daytimePlanetaryHourLength.milliseconds).toBe(
      result.daytimeDuration.milliseconds / 12,
    );
    expect(result.nighttimePlanetaryHourLength.milliseconds).toBe(
      result.nighttimeDuration.milliseconds / 12,
    );
    expect(result.daytimePlanetaryHourLength.milliseconds).not.toBe(
      result.nighttimePlanetaryHourLength.milliseconds,
    );
  });

  it.each([
    ['Sunday', '2026-07-19T06:00:00.000Z', 'Sun'],
    ['Monday', '2026-07-20T06:00:00.000Z', 'Moon'],
    ['Tuesday', '2026-07-21T06:00:00.000Z', 'Mars'],
    ['Wednesday', '2026-07-22T06:00:00.000Z', 'Mercury'],
    ['Thursday', '2026-07-23T06:00:00.000Z', 'Jupiter'],
    ['Friday', '2026-07-24T06:00:00.000Z', 'Venus'],
    ['Saturday', '2026-07-25T06:00:00.000Z', 'Saturn'],
  ])('uses the %s weekday ruler for hour 1', (_weekday, sunriseTime, ruler) => {
    const result = generatePlanetaryHoursSchedule({
      sunriseTime,
      sunsetTime: new Date(new Date(sunriseTime).getTime() + 12 * 60 * 60 * 1000),
      nextSunriseTime: new Date(new Date(sunriseTime).getTime() + 24 * 60 * 60 * 1000),
      date: sunriseTime,
      timezone: 'UTC',
    });

    expect(result.schedule[0].planet).toBe(ruler);
  });

  it('continues the Chaldean sequence through all 24 hours', () => {
    const result = generatePlanetaryHoursSchedule({
      sunriseTime: '2026-07-19T06:00:00.000Z',
      sunsetTime: '2026-07-19T18:00:00.000Z',
      nextSunriseTime: '2026-07-20T06:00:00.000Z',
      date: '2026-07-19T06:00:00.000Z',
      timezone: 'UTC',
    });
    const startIndex = chaldeanOrder.indexOf('Sun');

    result.schedule.forEach((hour, index) => {
      expect(hour.planet).toBe(chaldeanOrder[(startIndex + index) % chaldeanOrder.length]);
    });
  });

  it.each([
    ['India', 'Asia/Kolkata', '2026-03-21T00:45:00.000Z', '2026-03-21T12:48:00.000Z', '2026-03-22T00:44:00.000Z'],
    ['Saudi Arabia', 'Asia/Riyadh', '2026-06-21T02:05:00.000Z', '2026-06-21T15:02:00.000Z', '2026-06-22T02:06:00.000Z'],
    ['Europe', 'Europe/London', '2026-12-21T08:03:00.000Z', '2026-12-21T15:53:00.000Z', '2026-12-22T08:04:00.000Z'],
    ['North America', 'America/New_York', '2026-09-22T10:43:00.000Z', '2026-09-22T22:50:00.000Z', '2026-09-23T10:44:00.000Z'],
  ])('handles varying daylight lengths for %s', (_name, timezone, sunriseTime, sunsetTime, nextSunriseTime) => {
    const result = generatePlanetaryHoursSchedule({
      sunriseTime,
      sunsetTime,
      nextSunriseTime,
      date: sunriseTime,
      timezone,
    });

    expect(result.schedule).toHaveLength(24);
    expect(result.schedule[11].endTime.getTime()).toBe(new Date(sunsetTime).getTime());
    expect(result.schedule[23].endTime.getTime()).toBe(new Date(nextSunriseTime).getTime());
    expect(result.daytimePlanetaryHourLength.milliseconds).not.toBe(
      result.nighttimePlanetaryHourLength.milliseconds,
    );
  });

  it('determines weekday ruler from the selected timezone local date', () => {
    const result = generatePlanetaryHoursSchedule({
      sunriseTime: '2026-07-20T13:00:00.000Z',
      sunsetTime: '2026-07-21T03:00:00.000Z',
      nextSunriseTime: '2026-07-21T13:00:00.000Z',
      date: '2026-07-20T13:00:00.000Z',
      timezone: 'America/Los_Angeles',
    });

    expect(result.date).toBe('2026-07-20');
    expect(result.schedule[0].planet).toBe('Moon');
  });
});
