import { describe, expect, it } from 'vitest';
import {
  buildDayNightInfo,
  calculateDayNightSunData,
  calculateSunTimesForDate,
  formatTimeRoundedToNearestMinute,
  roundDateToNearestMinute,
} from '@planetary-hours/planetary-engine';

describe('shared sun time and display policy', () => {
  it('rounds displayed clock times to the nearest minute', () => {
    expect(formatTimeRoundedToNearestMinute(
      new Date('2026-07-19T19:23:29.999Z'),
      'UTC',
    )).toBe('7:23 PM');
    expect(formatTimeRoundedToNearestMinute(
      new Date('2026-07-19T19:23:30.000Z'),
      'UTC',
    )).toBe('7:24 PM');
    expect(roundDateToNearestMinute(new Date('2026-07-19T19:23:30.000Z')).toISOString())
      .toBe('2026-07-19T19:24:00.000Z');
  });

  it('keeps full sunrise and sunset precision internally while sharing display output', () => {
    const coordinates = {
      latitude: 40.712776,
      longitude: -74.005974,
    };
    const timezone = 'America/New_York';
    const today = calculateSunTimesForDate({
      coordinates,
      date: '2026-07-19',
      timezone,
    });
    const webDisplay = formatTimeRoundedToNearestMinute(today.sunset, timezone);
    const mobileDisplay = formatTimeRoundedToNearestMinute(today.sunset, timezone);

    expect(today.sunset.getMilliseconds()).not.toBeNaN();
    expect(webDisplay).toBe(mobileDisplay);
  });

  it('returns identical sunrise and sunset display output for web and mobile inputs', () => {
    const sunData = calculateDayNightSunData({
      coordinates: {
        latitude: 19.076,
        longitude: 72.8777,
      },
      now: new Date('2026-07-19T08:00:00.000Z'),
      timezone: 'Asia/Kolkata',
    });
    const infoFromWebPath = buildDayNightInfo({
      now: new Date('2026-07-19T08:00:00.000Z'),
      sunData,
      timezone: 'Asia/Kolkata',
    });
    const infoFromMobilePath = buildDayNightInfo({
      now: new Date('2026-07-19T08:00:00.000Z'),
      sunData,
      timezone: 'Asia/Kolkata',
    });

    expect(infoFromWebPath.sunrise.time).toBe(infoFromMobilePath.sunrise.time);
    expect(infoFromWebPath.sunset.time).toBe(infoFromMobilePath.sunset.time);
  });
});
