import { getTimes } from 'suncalc';

export type GeoCoordinates = {
  latitude: number;
  longitude: number;
};

export type SunTimes = {
  sunrise: Date;
  sunset: Date;
};

export type DayNightSunData = {
  yesterday: SunTimes;
  today: SunTimes;
  tomorrow: SunTimes;
};

export type DayNightInfo = {
  period: 'day' | 'night';
  sunrise: {
    label: string;
    time: string;
  };
  sunset: {
    label: string;
    time: string;
  };
};

export function calculateSunTimesForDate(input: {
  coordinates: GeoCoordinates;
  date: Date | string;
  timezone: string;
}): SunTimes {
  const dateKey = input.date instanceof Date
    ? getDateKeyInTimezone(input.date, input.timezone)
    : input.date;
  const calculationDate = zonedDateTimeToUtcDate({
    date: dateKey,
    hour: 12,
    minute: 0,
    second: 0,
    timezone: input.timezone,
  });
  const times = getTimes(
    calculationDate,
    input.coordinates.latitude,
    input.coordinates.longitude,
  );

  assertValidDate(times.sunrise, 'sunrise');
  assertValidDate(times.sunset, 'sunset');

  return {
    sunrise: times.sunrise,
    sunset: times.sunset,
  };
}

export function calculateDayNightSunData(input: {
  coordinates: GeoCoordinates;
  now: Date;
  timezone: string;
}): DayNightSunData {
  const today = getDateKeyInTimezone(input.now, input.timezone);
  const yesterday = offsetDateKey(today, -1);
  const tomorrow = offsetDateKey(today, 1);

  return {
    today: calculateSunTimesForDate({
      coordinates: input.coordinates,
      date: today,
      timezone: input.timezone,
    }),
    tomorrow: calculateSunTimesForDate({
      coordinates: input.coordinates,
      date: tomorrow,
      timezone: input.timezone,
    }),
    yesterday: calculateSunTimesForDate({
      coordinates: input.coordinates,
      date: yesterday,
      timezone: input.timezone,
    }),
  };
}

export function buildDayNightInfo(input: {
  now: Date;
  sunData: DayNightSunData;
  timezone: string;
}): DayNightInfo {
  const { today, tomorrow, yesterday } = input.sunData;
  const isDaytime = input.now >= today.sunrise && input.now < today.sunset;
  const isBeforeSunrise = input.now < today.sunrise;

  if (isDaytime) {
    return {
      period: 'day',
      sunrise: {
        label: 'Sunrise',
        time: formatTimeRoundedToNearestMinute(today.sunrise, input.timezone),
      },
      sunset: {
        label: 'Sunset',
        time: formatTimeRoundedToNearestMinute(today.sunset, input.timezone),
      },
    };
  }

  const nightSunset = isBeforeSunrise ? yesterday.sunset : today.sunset;
  const nextSunrise = isBeforeSunrise ? today.sunrise : tomorrow.sunrise;

  return {
    period: 'night',
    sunrise: {
      label: 'Sunrise (next sunrise)',
      time: formatTimeRoundedToNearestMinute(nextSunrise, input.timezone),
    },
    sunset: {
      label: isBeforeSunrise ? 'Sunset (previous sunset)' : 'Sunset (today)',
      time: formatTimeRoundedToNearestMinute(nightSunset, input.timezone),
    },
  };
}

export function formatTimeRoundedToNearestMinute(date: Date, timezone: string) {
  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone,
  }).format(roundDateToNearestMinute(date));
}

export function roundDateToNearestMinute(date: Date) {
  const rounded = new Date(date.getTime() + 30000);
  rounded.setSeconds(0, 0);
  return rounded;
}

export function getDateKeyInTimezone(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: timezone,
    year: 'numeric',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

export function offsetDateKey(dateKey: string, offsetDays: number) {
  const nextDate = new Date(`${dateKey}T12:00:00Z`);
  nextDate.setUTCDate(nextDate.getUTCDate() + offsetDays);
  return nextDate.toISOString().slice(0, 10);
}

export function zonedDateTimeToUtcDate(input: {
  date: string;
  hour: number;
  minute: number;
  second: number;
  timezone: string;
}) {
  const [year, month, day] = input.date.split('-').map(Number);
  const targetUtc = Date.UTC(year, month - 1, day, input.hour, input.minute, input.second);
  let guess = new Date(targetUtc);

  for (let index = 0; index < 3; index += 1) {
    const parts = getZonedDateParts(guess, input.timezone);
    const renderedUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      parts.hour,
      parts.minute,
      parts.second,
    );
    guess = new Date(guess.getTime() - (renderedUtc - targetUtc));
  }

  return guess;
}

function getZonedDateParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    month: '2-digit',
    second: '2-digit',
    timeZone: timezone,
    year: 'numeric',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    day: values.day,
    hour: Number(values.hour) === 24 ? 0 : Number(values.hour),
    minute: Number(values.minute),
    month: values.month,
    second: Number(values.second),
    year: values.year,
  };
}

function assertValidDate(date: Date | null, fieldName: string): asserts date is Date {
  if (!date || Number.isNaN(date.getTime())) {
    throw new Error(`${fieldName} is unavailable for this location`);
  }
}
