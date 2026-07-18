export type PlanetaryHoursEngineInput = {
  sunriseTime: Date | string;
  sunsetTime: Date | string;
  nextSunriseTime?: Date | string;
  date: Date | string;
  timezone: string;
};

export type DurationBreakdown = {
  milliseconds: number;
  seconds: number;
  minutes: number;
  hours: number;
};

export type PlanetaryHoursEngineResult = {
  date: string;
  timezone: string;
  sunriseTime: Date;
  sunsetTime: Date;
  nextSunriseTime: Date;
  daytimeDuration: DurationBreakdown;
  nighttimeDuration: DurationBreakdown;
  daytimePlanetaryHourLength: DurationBreakdown;
  nighttimePlanetaryHourLength: DurationBreakdown;
};

export type PlanetaryHourScheduleRow = {
  hour: number;
  planet: PlanetName;
  startTime: Date;
  endTime: Date;
};

export type PlanetaryHoursScheduleResult = PlanetaryHoursEngineResult & {
  schedule: PlanetaryHourScheduleRow[];
};

type PlanetName =
  | 'Saturn'
  | 'Jupiter'
  | 'Mars'
  | 'Sun'
  | 'Venus'
  | 'Mercury'
  | 'Moon';

const HOURS_PER_DAY_OR_NIGHT = 12;
const TOTAL_PLANETARY_HOURS = 24;
const CHALDEAN_ORDER: PlanetName[] = [
  'Saturn',
  'Jupiter',
  'Mars',
  'Sun',
  'Venus',
  'Mercury',
  'Moon',
];
const WEEKDAY_RULERS: PlanetName[] = [
  'Sun',
  'Moon',
  'Mars',
  'Mercury',
  'Jupiter',
  'Venus',
  'Saturn',
];

export function calculatePlanetaryHourDurations(
  input: PlanetaryHoursEngineInput,
): PlanetaryHoursEngineResult {
  const sunriseTime = normalizeDate(input.sunriseTime, 'sunriseTime');
  const sunsetTime = normalizeDate(input.sunsetTime, 'sunsetTime');
  const date = normalizeDate(input.date, 'date');

  if (!input.timezone.trim()) {
    throw new Error('timezone is required');
  }

  if (sunsetTime <= sunriseTime) {
    throw new Error('sunsetTime must be after sunriseTime');
  }

  const nextSunriseTime = input.nextSunriseTime
    ? normalizeDate(input.nextSunriseTime, 'nextSunriseTime')
    : getNextLocalSunriseTime(sunriseTime, date, input.timezone);
  const daytimeMilliseconds = sunsetTime.getTime() - sunriseTime.getTime();
  const nighttimeMilliseconds = nextSunriseTime.getTime() - sunsetTime.getTime();

  if (nighttimeMilliseconds <= 0) {
    throw new Error('next sunrise must be after sunsetTime');
  }

  return {
    date: formatDateKey(date, input.timezone),
    timezone: input.timezone,
    sunriseTime,
    sunsetTime,
    nextSunriseTime,
    daytimeDuration: toDurationBreakdown(daytimeMilliseconds),
    nighttimeDuration: toDurationBreakdown(nighttimeMilliseconds),
    daytimePlanetaryHourLength: toDurationBreakdown(
      daytimeMilliseconds / HOURS_PER_DAY_OR_NIGHT,
    ),
    nighttimePlanetaryHourLength: toDurationBreakdown(
      nighttimeMilliseconds / HOURS_PER_DAY_OR_NIGHT,
    ),
  };
}

export function generatePlanetaryHoursSchedule(
  input: PlanetaryHoursEngineInput,
): PlanetaryHoursScheduleResult {
  const durations = calculatePlanetaryHourDurations(input);
  const firstPlanet = getWeekdayRuler(durations.sunriseTime, durations.timezone);
  const firstPlanetIndex = CHALDEAN_ORDER.indexOf(firstPlanet);
  const dayBoundaries = buildPeriodBoundaries(
    durations.sunriseTime,
    durations.sunsetTime,
    HOURS_PER_DAY_OR_NIGHT,
  );
  const nightBoundaries = buildPeriodBoundaries(
    durations.sunsetTime,
    durations.nextSunriseTime,
    HOURS_PER_DAY_OR_NIGHT,
  );

  const schedule = Array.from({ length: TOTAL_PLANETARY_HOURS }, (_, index) => {
    const isDayHour = index < HOURS_PER_DAY_OR_NIGHT;
    const periodIndex = isDayHour ? index : index - HOURS_PER_DAY_OR_NIGHT;
    const boundaries = isDayHour ? dayBoundaries : nightBoundaries;
    const startTime = boundaries[periodIndex];
    const endTime = boundaries[periodIndex + 1];
    const planet = CHALDEAN_ORDER[(firstPlanetIndex + index) % CHALDEAN_ORDER.length];

    return {
      hour: index + 1,
      planet,
      startTime,
      endTime,
    };
  });

  return {
    ...durations,
    schedule,
  };
}

function buildPeriodBoundaries(startTime: Date, endTime: Date, segmentCount: number) {
  const startMilliseconds = startTime.getTime();
  const durationMilliseconds = endTime.getTime() - startMilliseconds;

  return Array.from({ length: segmentCount + 1 }, (_, index) => {
    if (index === 0) {
      return new Date(startTime);
    }

    if (index === segmentCount) {
      return new Date(endTime);
    }

    return new Date(startMilliseconds + Math.round((durationMilliseconds * index) / segmentCount));
  });
}

function normalizeDate(value: Date | string, fieldName: string) {
  const date = value instanceof Date ? new Date(value) : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${fieldName} must be a valid Date or date string`);
  }

  return date;
}

function toDurationBreakdown(milliseconds: number): DurationBreakdown {
  return {
    milliseconds,
    seconds: milliseconds / 1000,
    minutes: milliseconds / 60000,
    hours: milliseconds / 3600000,
  };
}

function getNextLocalSunriseTime(sunriseTime: Date, date: Date, timezone: string) {
  const sunriseParts = getZonedDateParts(sunriseTime, timezone);
  const nextDate = offsetDateKey(formatDateKey(date, timezone), 1);

  return zonedDateTimeToUtcDate({
    date: nextDate,
    hour: sunriseParts.hour,
    minute: sunriseParts.minute,
    second: sunriseParts.second,
    timezone,
  });
}

function formatDateKey(date: Date, timezone: string) {
  const parts = getZonedDateParts(date, timezone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function offsetDateKey(dateKey: string, offsetDays: number) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
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
    year: values.year,
    month: values.month,
    day: values.day,
    hour: normalizeHour(Number(values.hour)),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

function zonedDateTimeToUtcDate(input: {
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

function normalizeHour(hour: number) {
  return hour === 24 ? 0 : hour;
}

function getWeekdayRuler(date: Date, timezone: string) {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
  }).format(date);
  const weekdayIndex = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ].indexOf(weekday);

  return WEEKDAY_RULERS[weekdayIndex];
}
