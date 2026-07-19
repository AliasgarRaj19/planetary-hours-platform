import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import * as Location from 'expo-location';
import {
  buildPlanetaryHourSummary,
  calculateCountdownToHourEnd,
  calculateSunTimesForDate,
  formatCountdown,
  formatTimeRoundedToNearestMinute,
  getDateKeyInTimezone,
  generatePlanetaryHoursSchedule,
  offsetDateKey,
  type PlanetaryHourScheduleRow,
  zonedDateTimeToUtcDate,
} from '@planetary-hours/planetary-engine';
import { readLocationPreference, saveLocationPreference } from './location-preferences';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type LocationMode = 'approximate' | 'device' | 'manual';

export type CitySearchResult = Coordinates & {
  id: number;
  timezone: string;
  displayName: string;
};

export type PlanetaryDaySchedule = {
  date: Date;
  daylight: {
    sunrise: Date;
    sunset: Date;
    hours: PlanetaryHourScheduleRow[];
  };
  night: {
    sunset: Date;
    sunrise: Date;
    hours: PlanetaryHourScheduleRow[];
  };
  schedule: PlanetaryHourScheduleRow[];
};

type PlanetaryState = {
  activeHour: PlanetaryHourScheduleRow | null;
  coordinates: Coordinates | null;
  countdownLabel: string;
  currentDate: Date;
  currentSchedule: PlanetaryDaySchedule | null;
  errorMessage: string;
  getScheduleForDate: (date: Date) => PlanetaryDaySchedule | null;
  isLoadingLocation: boolean;
  isLocationSelectorOpen: boolean;
  locationDisplayName: string;
  locationMode: LocationMode;
  locationStatus: string;
  nextHour: PlanetaryHourScheduleRow | null;
  now: Date;
  openLocationSelector: () => void;
  closeLocationSelector: () => void;
  searchCities: (query: string) => Promise<CitySearchResult[]>;
  selectDeviceLocation: (requestPermission?: boolean) => Promise<void>;
  selectManualLocation: (city: CitySearchResult) => void;
  timezone: string;
};

type LocatedPosition = {
  coordinates: Coordinates;
  source: 'cached' | 'current';
};

const PlanetaryContext = createContext<PlanetaryState | null>(null);

const LOCATION_TIMEOUT_MS = 20000;
const CACHED_LOCATION_MAX_AGE_MS = 5 * 60 * 1000;
const CACHED_LOCATION_REQUIRED_ACCURACY_METERS = 1000;
const OPEN_METEO_SEARCH_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const GETTING_LOCATION_STATUS = 'Getting your location...';
const LOCATION_PERMISSION_DENIED_MESSAGE =
  'Location permission was not allowed. Approximate mode is active.';

let didStartStartupLocationHydration = false;

type DeviceLocationOptions = {
  persistApproximateOnFailure?: boolean;
  persistDeviceOnSuccess?: boolean;
};

export function PlanetaryProvider({ children }: PropsWithChildren) {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLocationSelectorOpen, setIsLocationSelectorOpen] = useState(false);
  const [locationDisplayName, setLocationDisplayName] = useState('Approximate location');
  const [locationMode, setLocationMode] = useState<LocationMode>('approximate');
  const [locationStatus, setLocationStatus] = useState('Approximate mode');
  const [now, setNow] = useState(() => new Date());
  const [timezone, setTimezone] = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  );
  const didTryAutomaticLocation = useRef(false);
  const lastDiagnosticsKey = useRef('');
  const loadingRef = useRef(false);
  const mountedRef = useRef(false);
  const activeLocationRequestId = useRef(0);

  const currentDateKey = getDateKeyInTimezone(now, timezone);
  const currentDate = useMemo(() => dateFromLocalDateKey(currentDateKey), [currentDateKey]);

  const getScheduleForDate = useCallback(
    (date: Date) => buildDaySchedule(date, timezone, coordinates),
    [coordinates, timezone],
  );

  const currentSchedule = useMemo(
    () => getScheduleForDate(currentDate),
    [currentDate, getScheduleForDate],
  );

  const completeSchedule = useMemo(() => {
    const yesterday = getScheduleForDate(offsetLocalDate(currentDate, -1));
    const today = getScheduleForDate(currentDate);
    const tomorrow = getScheduleForDate(offsetLocalDate(currentDate, 1));

    return [
      ...(yesterday?.schedule ?? []),
      ...(today?.schedule ?? []),
      ...(tomorrow?.schedule ?? []),
    ].sort((first, second) => first.startTime.getTime() - second.startTime.getTime());
  }, [currentDate, getScheduleForDate]);

  const summary = useMemo(
    () => buildPlanetaryHourSummary(completeSchedule, now),
    [completeSchedule, now],
  );

  const selectDeviceLocation = useCallback(async (
    requestPermission = true,
    options: DeviceLocationOptions = {},
  ) => {
    if (loadingRef.current) {
      return;
    }

    const requestId = activeLocationRequestId.current + 1;
    activeLocationRequestId.current = requestId;
    loadingRef.current = true;
    applyIfActive(mountedRef, activeLocationRequestId, requestId, () => {
      setIsLoadingLocation(true);
      setErrorMessage('');
      setLocationMode('device');
      setLocationStatus(GETTING_LOCATION_STATUS);
    });

    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();

      if (!servicesEnabled) {
        throw new Error('Location services are disabled. Approximate mode is active.');
      }

      const existingPermission = await Location.getForegroundPermissionsAsync();

      if (existingPermission.status !== Location.PermissionStatus.GRANTED && !requestPermission) {
        applyIfActive(mountedRef, activeLocationRequestId, requestId, () => {
          setCoordinates(null);
          setLocationDisplayName('Approximate location');
          setLocationMode('approximate');
          setLocationStatus('Approximate mode');
          setErrorMessage(LOCATION_PERMISSION_DENIED_MESSAGE);
        });
        return;
      }

      const permission =
        existingPermission.status === Location.PermissionStatus.GRANTED
          ? existingPermission
          : await Location.requestForegroundPermissionsAsync();

      if (permission.status !== Location.PermissionStatus.GRANTED) {
        throw new Error(LOCATION_PERMISSION_DENIED_MESSAGE);
      }

      const locatedPosition = await getDevicePosition();

      if (options.persistDeviceOnSuccess !== false) {
        void saveLocationPreference({ mode: 'device' });
      }

      applyIfActive(mountedRef, activeLocationRequestId, requestId, () => {
        setCoordinates(locatedPosition.coordinates);
        setLocationDisplayName('Device location');
        setLocationMode('device');
        setLocationStatus(
          locatedPosition.source === 'cached'
            ? 'Using recent device location'
            : 'Using current location',
        );
        setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
        setIsLocationSelectorOpen(false);
      });
      logDiagnosticsOnce({
        coordinates: locatedPosition.coordinates,
        keyPrefix: locatedPosition.source,
        now: new Date(),
        ref: lastDiagnosticsKey,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      });
    } catch (error) {
      if (options.persistApproximateOnFailure) {
        void saveLocationPreference({ mode: 'approximate' });
      }

      applyIfActive(mountedRef, activeLocationRequestId, requestId, () => {
        setCoordinates(null);
        setLocationDisplayName('Approximate location');
        setLocationMode('approximate');
        setLocationStatus('Approximate mode');
        setErrorMessage(
          error instanceof Error ? error.message : 'Unable to retrieve device location.',
        );
      });
    } finally {
      loadingRef.current = false;
      applyIfActive(mountedRef, activeLocationRequestId, requestId, () => {
        setIsLoadingLocation(false);
      });
    }
  }, []);

  const searchCities = useCallback(async (query: string) => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      return [];
    }

    const params = new URLSearchParams({
      count: '8',
      format: 'json',
      language: 'en',
      name: trimmedQuery,
    });
    const response = await fetch(`${OPEN_METEO_SEARCH_URL}?${params.toString()}`);

    if (!response.ok) {
      throw new Error('City search is unavailable.');
    }

    const data = (await response.json()) as {
      results?: Array<{
        admin1?: string;
        country?: string;
        id: number;
        latitude: number;
        longitude: number;
        name: string;
        timezone?: string;
      }>;
    };

    return (data.results ?? [])
      .filter((result) => result.timezone)
      .map((result) => ({
        displayName: [result.name, result.admin1, result.country].filter(Boolean).join(', '),
        id: result.id,
        latitude: result.latitude,
        longitude: result.longitude,
        timezone: result.timezone as string,
      }));
  }, []);

  const selectManualLocation = useCallback((city: CitySearchResult) => {
    setCoordinates({
      latitude: city.latitude,
      longitude: city.longitude,
    });
    setErrorMessage('');
    setLocationDisplayName(city.displayName);
    setLocationMode('manual');
    setLocationStatus('Using selected location');
    setTimezone(city.timezone);
    setIsLocationSelectorOpen(false);
    void saveLocationPreference({
      location: {
        displayName: city.displayName,
        id: city.id,
        latitude: city.latitude,
        longitude: city.longitude,
        timezone: city.timezone,
      },
      mode: 'manual',
    });
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      activeLocationRequestId.current += 1;
    };
  }, []);

  useEffect(() => {
    const timerId = setInterval(() => {
      setNow(new Date());
      setTimezone((current) => {
        if (coordinates) {
          return current;
        }

        return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [coordinates]);

  useEffect(() => {
    if (didTryAutomaticLocation.current) {
      return;
    }

    didTryAutomaticLocation.current = true;
    const timerId = setTimeout(() => {
      if (didStartStartupLocationHydration) {
        return;
      }

      didStartStartupLocationHydration = true;
      void hydrateLocationPreference({
        applyManualLocation: (city) => {
          setCoordinates({
            latitude: city.latitude,
            longitude: city.longitude,
          });
          setErrorMessage('');
          setLocationDisplayName(city.displayName);
          setLocationMode('manual');
          setLocationStatus('Using selected location');
          setTimezone(city.timezone);
        },
        applyApproximateLocation: () => {
          setCoordinates(null);
          setLocationDisplayName('Approximate location');
          setLocationMode('approximate');
          setLocationStatus('Approximate mode');
        },
        mountedRef,
        selectDeviceLocation,
      });
    }, 0);

    return () => clearTimeout(timerId);
  }, [selectDeviceLocation]);

  const value = useMemo<PlanetaryState>(
    () => ({
      activeHour: summary.currentHour,
      closeLocationSelector: () => setIsLocationSelectorOpen(false),
      coordinates,
      countdownLabel: formatCountdown(calculateCountdownToHourEnd(summary.currentHour)),
      currentDate,
      currentSchedule,
      errorMessage,
      getScheduleForDate,
      isLoadingLocation,
      isLocationSelectorOpen,
      locationDisplayName,
      locationMode,
      locationStatus,
      nextHour: summary.nextHour,
      now,
      openLocationSelector: () => setIsLocationSelectorOpen(true),
      searchCities,
      selectDeviceLocation,
      selectManualLocation,
      timezone,
    }),
    [
      coordinates,
      currentDate,
      currentSchedule,
      errorMessage,
      getScheduleForDate,
      isLoadingLocation,
      isLocationSelectorOpen,
      locationDisplayName,
      locationMode,
      locationStatus,
      now,
      searchCities,
      selectDeviceLocation,
      selectManualLocation,
      summary.currentHour,
      summary.nextHour,
      timezone,
    ],
  );

  return <PlanetaryContext.Provider value={value}>{children}</PlanetaryContext.Provider>;
}

export function usePlanetary() {
  const value = useContext(PlanetaryContext);

  if (!value) {
    throw new Error('usePlanetary must be used inside PlanetaryProvider');
  }

  return value;
}

function applyIfActive(
  mountedRef: { current: boolean },
  activeRequestId: { current: number },
  requestId: number,
  update: () => void,
) {
  if (mountedRef.current && activeRequestId.current === requestId) {
    update();
  }
}

async function hydrateLocationPreference(input: {
  applyApproximateLocation: () => void;
  applyManualLocation: (city: CitySearchResult) => void;
  mountedRef: { current: boolean };
  selectDeviceLocation: (
    requestPermission?: boolean,
    options?: DeviceLocationOptions,
  ) => Promise<void>;
}) {
  const preference = await readLocationPreference();

  if (!input.mountedRef.current) {
    return;
  }

  if (!preference) {
    await input.selectDeviceLocation(true, {
      persistApproximateOnFailure: true,
      persistDeviceOnSuccess: true,
    });
    return;
  }

  if (preference.mode === 'device') {
    await input.selectDeviceLocation(false, {
      persistDeviceOnSuccess: true,
    });
    return;
  }

  if (preference.mode === 'manual') {
    input.applyManualLocation(preference.location);
    return;
  }

  input.applyApproximateLocation();
}

async function getDevicePosition(): Promise<LocatedPosition> {
  const cachedPosition = await Location.getLastKnownPositionAsync({
    maxAge: CACHED_LOCATION_MAX_AGE_MS,
    requiredAccuracy: CACHED_LOCATION_REQUIRED_ACCURACY_METERS,
  });

  if (cachedPosition) {
    return {
      coordinates: {
        latitude: cachedPosition.coords.latitude,
        longitude: cachedPosition.coords.longitude,
      },
      source: 'cached',
    };
  }

  const currentPosition = await withTimeout(
    Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    }),
    LOCATION_TIMEOUT_MS,
    'Location request timed out. Approximate mode is active.',
  );

  return {
    coordinates: {
      latitude: currentPosition.coords.latitude,
      longitude: currentPosition.coords.longitude,
    },
    source: 'current',
  };
}

async function withTimeout<T>(promise: Promise<T>, timeoutMilliseconds: number, message: string) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(message)), timeoutMilliseconds);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

function buildDaySchedule(
  date: Date,
  timezone: string,
  coordinates: Coordinates | null,
): PlanetaryDaySchedule | null {
  try {
    const dateKey = getDateKeyInTimezone(date, timezone);
    const nextDateKey = offsetDateKey(dateKey, 1);
    const scheduleDate = zonedDateTimeToUtcDate({
      date: dateKey,
      hour: 12,
      minute: 0,
      second: 0,
      timezone,
    });
    const sunTimes = coordinates
      ? calculateSunTimesForDate({
          coordinates,
          date: dateKey,
          timezone,
        })
      : null;
    const nextSunTimes = coordinates
      ? calculateSunTimesForDate({
          coordinates,
          date: nextDateKey,
          timezone,
        })
      : null;
    const sunrise = sunTimes
      ? sunTimes.sunrise
      : zonedDateTimeToUtcDate({
          date: dateKey,
          hour: 6,
          minute: 0,
          second: 0,
          timezone,
        });
    const sunset = sunTimes
      ? sunTimes.sunset
      : zonedDateTimeToUtcDate({
          date: dateKey,
          hour: 18,
          minute: 0,
          second: 0,
          timezone,
        });
    const nextSunrise = nextSunTimes
      ? nextSunTimes.sunrise
      : zonedDateTimeToUtcDate({
          date: nextDateKey,
          hour: 6,
          minute: 0,
          second: 0,
          timezone,
        });
    const schedule = generatePlanetaryHoursSchedule({
      date: sunrise,
      nextSunriseTime: nextSunrise,
      sunriseTime: sunrise,
      sunsetTime: sunset,
      timezone,
    }).schedule;

    return {
      date: scheduleDate,
      daylight: {
        hours: schedule.slice(0, 12),
        sunrise,
        sunset,
      },
      night: {
        hours: schedule.slice(12, 24),
        sunrise: nextSunrise,
        sunset,
      },
      schedule,
    };
  } catch (error) {
    if (__DEV__) {
      console.warn('[Planetary Hours schedule]', error);
    }

    return null;
  }
}

function atLocalTime(date: Date, hour: number) {
  const nextDate = new Date(date);
  nextDate.setHours(hour, 0, 0, 0);
  return nextDate;
}

export function offsetLocalDate(date: Date, offsetDays: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + offsetDays);
  return nextDate;
}

export function formatTime(date: Date, timezone: string) {
  return formatTimeRoundedToNearestMinute(date, timezone);
}

export function formatDate(date: Date, timezone: string) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'full',
    timeZone: timezone,
  }).format(date);
}

export function formatCoordinate(value: number) {
  return value.toFixed(4);
}

function dateFromLocalDateKey(dateKey: string) {
  return new Date(`${dateKey}T12:00:00Z`);
}

function logDiagnosticsOnce(input: {
  coordinates: Coordinates;
  keyPrefix: string;
  now: Date;
  ref: { current: string };
  timezone: string;
}) {
  if (!__DEV__) {
    return;
  }

  const todaySunTimes = calculateSunTimesForDate({
    coordinates: input.coordinates,
    date: input.now,
    timezone: input.timezone,
  });
  const key = `${input.keyPrefix}-${formatCoordinate(input.coordinates.latitude)}-${formatCoordinate(
    input.coordinates.longitude,
  )}-${formatDate(input.now, input.timezone)}`;

  if (input.ref.current === key) {
    return;
  }

  input.ref.current = key;
  console.log('[Planetary Hours diagnostics]', {
    currentLocalDateTime: new Intl.DateTimeFormat('en', {
      dateStyle: 'medium',
      timeStyle: 'medium',
      timeZone: input.timezone,
    }).format(input.now),
    latitude: input.coordinates.latitude,
    locationSource: input.keyPrefix,
    longitude: input.coordinates.longitude,
    sunriseIso: todaySunTimes.sunrise?.toISOString(),
    sunriseLocal: todaySunTimes.sunrise
      ? formatTime(todaySunTimes.sunrise, input.timezone)
      : undefined,
    sunsetIso: todaySunTimes.sunset?.toISOString(),
    sunsetLocal: todaySunTimes.sunset
      ? formatTime(todaySunTimes.sunset, input.timezone)
      : undefined,
    timezone: input.timezone,
  });
}
