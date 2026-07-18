import { useEffect, useState } from 'react';
import type { SelectedLocation } from '../services/locationService';
import {
  fetchDayNightSunData,
  type DayNightSunData,
} from '../services/sunriseSunsetService';

type UseDayNightSunDataResult = {
  sunData: DayNightSunData | null;
  status: string;
  retry: () => void;
};

export function useDayNightSunData(
  location: SelectedLocation | null,
  now: Date,
): UseDayNightSunDataResult {
  const [sunData, setSunData] = useState<DayNightSunData | null>(null);
  const [status, setStatus] = useState('Select a location to load sunrise and sunset.');
  const [retryCount, setRetryCount] = useState(0);
  const localDateKey = location ? getDateKey(now, location.timezone) : '';

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function loadSunTimes() {
      if (!location) {
        setSunData(null);
        setStatus('Select a location to load sunrise and sunset.');
        return;
      }

      setStatus('Loading sunrise and sunset...');

      try {
        const nextSunData = await fetchDayNightSunData(location, now, controller.signal);

        if (!isMounted) {
          return;
        }

        setSunData(nextSunData);
        setStatus('');
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        setSunData(null);
        setStatus('Unable to load sunrise and sunset right now.');
      }
    }

    loadSunTimes();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [location, localDateKey, retryCount]);

  return {
    sunData,
    status,
    retry: () => setRetryCount((current) => current + 1),
  };
}

function getDateKey(date: Date, timezone: string) {
  return new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: timezone,
    year: 'numeric',
  }).format(date);
}
