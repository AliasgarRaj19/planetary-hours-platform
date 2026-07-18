import type { SelectedLocation } from './locationService';

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

export type DayNightSunData = {
  yesterday: SunTimes;
  today: SunTimes;
  tomorrow: SunTimes;
};

type SunriseSunsetResponse = {
  status: string;
  results?: {
    sunrise?: string;
    sunset?: string;
  };
};

export type SunTimes = {
  sunrise: Date;
  sunset: Date;
};

const SUNRISE_SUNSET_API_URL = 'https://api.sunrise-sunset.org/json';
const SUNRISE_SUNSET_TIMEOUT_MS = 10000;

export async function fetchDayNightSunData(
  location: SelectedLocation,
  now: Date,
  signal?: AbortSignal,
): Promise<DayNightSunData> {
  if (!location.timezone) {
    throw new Error('Timezone is unavailable for the selected location');
  }

  const today = getDateInTimezone(now, location.timezone);
  const yesterday = offsetDate(today, -1);
  const tomorrow = offsetDate(today, 1);

  const [yesterdayTimes, todayTimes, tomorrowTimes] = await Promise.all([
    fetchSunTimes(location, yesterday, signal),
    fetchSunTimes(location, today, signal),
    fetchSunTimes(location, tomorrow, signal),
  ]);

  return {
    yesterday: yesterdayTimes,
    today: todayTimes,
    tomorrow: tomorrowTimes,
  };
}

export function buildDayNightInfo(
  location: SelectedLocation,
  now: Date,
  sunData: DayNightSunData,
): DayNightInfo {
  const { today: todayTimes, tomorrow: tomorrowTimes, yesterday: yesterdayTimes } = sunData;

  const isDaytime = now >= todayTimes.sunrise && now < todayTimes.sunset;
  const isBeforeSunrise = now < todayTimes.sunrise;

  if (isDaytime) {
    return {
      period: 'day',
      sunrise: {
        label: '\u{1F305} Sunrise',
        time: formatTime(todayTimes.sunrise, location.timezone),
      },
      sunset: {
        label: '\u{1F307} Sunset',
        time: formatTime(todayTimes.sunset, location.timezone),
      },
    };
  }

  const nightSunset = isBeforeSunrise ? yesterdayTimes.sunset : todayTimes.sunset;
  const nextSunrise = isBeforeSunrise ? todayTimes.sunrise : tomorrowTimes.sunrise;

  return {
    period: 'night',
    sunset: {
      label: isBeforeSunrise
        ? '\u{1F307} Sunset (previous sunset)'
        : '\u{1F307} Sunset (today)',
      time: formatTime(nightSunset, location.timezone),
    },
    sunrise: {
      label: '\u{1F305} Sunrise (next sunrise)',
      time: formatTime(nextSunrise, location.timezone),
    },
  };
}

async function fetchSunTimes(
  location: SelectedLocation,
  date: string,
  signal?: AbortSignal,
): Promise<SunTimes> {
  const params = new URLSearchParams({
    lat: String(location.latitude),
    lng: String(location.longitude),
    date,
    formatted: '0',
  });

  const response = await fetchWithTimeout(
    `${SUNRISE_SUNSET_API_URL}?${params.toString()}`,
    signal,
  );

  if (!response.ok) {
    throw new Error('Unable to fetch sunrise and sunset');
  }

  const data = (await response.json()) as SunriseSunsetResponse;

  if (data.status !== 'OK' || !data.results?.sunrise || !data.results?.sunset) {
    throw new Error('Sunrise and sunset API returned an invalid response');
  }

  const sunrise = new Date(data.results.sunrise);
  const sunset = new Date(data.results.sunset);

  if (Number.isNaN(sunrise.getTime()) || Number.isNaN(sunset.getTime())) {
    throw new Error('Sunrise and sunset API returned incomplete data');
  }

  return {
    sunrise,
    sunset,
  };
}

async function fetchWithTimeout(url: string, signal?: AbortSignal) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(
    () => controller.abort(),
    SUNRISE_SUNSET_TIMEOUT_MS,
  );

  function abortRequest() {
    controller.abort();
  }

  signal?.addEventListener('abort', abortRequest, { once: true });

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    window.clearTimeout(timeoutId);
    signal?.removeEventListener('abort', abortRequest);
  }
}

function getDateInTimezone(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: timezone,
    year: 'numeric',
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

function offsetDate(date: string, offsetDays: number) {
  const nextDate = new Date(`${date}T12:00:00Z`);
  nextDate.setUTCDate(nextDate.getUTCDate() + offsetDays);
  return nextDate.toISOString().slice(0, 10);
}

function formatTime(date: Date, timezone: string) {
  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone,
  }).format(date);
}
