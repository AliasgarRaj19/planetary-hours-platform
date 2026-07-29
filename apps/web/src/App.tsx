import { useEffect, useMemo, useState } from 'react';
import { Header } from './components/Header';
import { DayNightInfoCard } from './components/DayNightInfoCard';
import { SummaryCards } from './components/SummaryCards';
import { PlanetaryHoursTable } from './components/PlanetaryHoursTable';
import { SolarSystemBackground } from './components/SolarSystemBackground';
import { Footer } from './components/Footer';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { DisclaimerPage } from './pages/DisclaimerPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsOfUsePage } from './pages/TermsOfUsePage';
import {
  buildPlanetaryHourSummary,
  calculateCountdownToHourEnd,
  generatePlanetaryHoursSchedule,
  getDateKeyInTimezone,
  getVisiblePlanetaryHours,
  type PlanetaryHourScheduleRow,
} from '@planetary-hours/planetary-engine';
import {
  getBrowserPosition,
  reverseGeocodeCoordinates,
  type SelectedLocation,
} from './services/locationService';
import { useDayNightSunData } from './hooks/useDayNightSunData';
import { useZonedClock } from './hooks/useZonedClock';
import { getPlanetaryHours } from './api/planetary-hours';
import type {
  WebsitePlanetaryHourContent,
  WebsitePlanetaryHourRow,
} from './types/planetaryHoursContent';

type ContentByDay = Partial<Record<number, WebsitePlanetaryHourContent[]>>;

function HomePage() {
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [openLocationSelector, setOpenLocationSelector] = useState(false);
  const [contentByDay, setContentByDay] = useState<ContentByDay>({});
  const [contentLoadingDays, setContentLoadingDays] = useState<Set<number>>(() => new Set());
  const [contentFailedDays, setContentFailedDays] = useState<Set<number>>(() => new Set());
  const { currentDate, currentTime, now } = useZonedClock(selectedLocation?.timezone);
  const {
    retry: retrySunData,
    status: sunDataStatus,
    sunData,
  } = useDayNightSunData(selectedLocation, now);

  useEffect(() => {
    let isMounted = true;

    async function requestLocation() {
      try {
        const coordinates = await getBrowserPosition();
        const location = await reverseGeocodeCoordinates(coordinates);

        if (!isMounted) {
          return;
        }

        setSelectedLocation(location);
        setOpenLocationSelector(false);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setOpenLocationSelector(true);
      }
    }

    requestLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  const dateTimeLabel = useMemo(() => {
    if (!currentDate || !currentTime) {
      return 'Local time loading...';
    }

    return `${currentDate} - ${currentTime}`;
  }, [currentDate, currentTime]);

  function handleManualLocationSelected(location: SelectedLocation) {
    setSelectedLocation(location);
    setOpenLocationSelector(false);
  }

  const requiredContentDays = useMemo(() => {
    if (!selectedLocation || !sunData) {
      return [];
    }

    return uniqueNumbers([
      getBackendDayOfWeek(sunData.yesterday.sunrise, selectedLocation.timezone),
      getBackendDayOfWeek(sunData.today.sunrise, selectedLocation.timezone),
      getBackendDayOfWeek(sunData.tomorrow.sunrise, selectedLocation.timezone),
    ]);
  }, [selectedLocation, sunData]);

  useEffect(() => {
    const missingDays = requiredContentDays.filter(
      (dayOfWeek) => !contentByDay[dayOfWeek],
    );

    if (missingDays.length === 0) {
      return undefined;
    }

    const controller = new AbortController();

    setContentLoadingDays((currentDays) => {
      const nextDays = new Set(currentDays);
      missingDays.forEach((dayOfWeek) => nextDays.add(dayOfWeek));
      return nextDays;
    });

    missingDays.forEach((dayOfWeek) => {
      getPlanetaryHours(dayOfWeek, controller.signal)
        .then((content) => {
          if (controller.signal.aborted) {
            return;
          }

          setContentByDay((currentContent) => ({
            ...currentContent,
            [dayOfWeek]: content,
          }));
          setContentFailedDays((currentDays) => {
            const nextDays = new Set(currentDays);
            nextDays.delete(dayOfWeek);
            return nextDays;
          });
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) {
            return;
          }

          if (error instanceof DOMException && error.name === 'AbortError') {
            return;
          }

          setContentFailedDays((currentDays) => new Set(currentDays).add(dayOfWeek));
        })
        .finally(() => {
          if (controller.signal.aborted) {
            return;
          }

          setContentLoadingDays((currentDays) => {
            const nextDays = new Set(currentDays);
            nextDays.delete(dayOfWeek);
            return nextDays;
          });
        });
    });

    return () => controller.abort();
  }, [requiredContentDays]);

  const fullPlanetarySchedules = useMemo(() => {
    if (!selectedLocation || !sunData) {
      return null;
    }

    try {
      const todayDayOfWeek = getBackendDayOfWeek(sunData.today.sunrise, selectedLocation.timezone);
      const yesterdayDayOfWeek = getBackendDayOfWeek(
        sunData.yesterday.sunrise,
        selectedLocation.timezone,
      );
      const tomorrowDayOfWeek = getBackendDayOfWeek(
        sunData.tomorrow.sunrise,
        selectedLocation.timezone,
      );

      const todaySchedule = mergeScheduleWithContent(
        generatePlanetaryHoursSchedule({
        sunriseTime: sunData.today.sunrise,
        sunsetTime: sunData.today.sunset,
        nextSunriseTime: sunData.tomorrow.sunrise,
        date: sunData.today.sunrise,
        timezone: selectedLocation.timezone,
        }).schedule,
        contentByDay[todayDayOfWeek],
      );

      const yesterdaySchedule = mergeScheduleWithContent(
        generatePlanetaryHoursSchedule({
        sunriseTime: sunData.yesterday.sunrise,
        sunsetTime: sunData.yesterday.sunset,
        nextSunriseTime: sunData.today.sunrise,
        date: sunData.yesterday.sunrise,
        timezone: selectedLocation.timezone,
        }).schedule,
        contentByDay[yesterdayDayOfWeek],
      );

      const tomorrowSchedule = mergeScheduleWithContent(
        generatePlanetaryHoursSchedule({
        sunriseTime: sunData.tomorrow.sunrise,
        sunsetTime: sunData.tomorrow.sunset,
        date: sunData.tomorrow.sunrise,
        timezone: selectedLocation.timezone,
        }).schedule,
        contentByDay[tomorrowDayOfWeek],
      );

      return {
        todaySchedule,
        tomorrowSchedule,
        yesterdaySchedule,
      };
    } catch {
      return null;
    }
  }, [contentByDay, selectedLocation, sunData]);

  const completePlanetarySchedule = useMemo(() => {
    if (!fullPlanetarySchedules) {
      return [];
    }

    return [
      ...fullPlanetarySchedules.yesterdaySchedule,
      ...fullPlanetarySchedules.todaySchedule,
      ...fullPlanetarySchedules.tomorrowSchedule,
    ].sort((first, second) => first.startTime.getTime() - second.startTime.getTime());
  }, [fullPlanetarySchedules]);

  const visiblePlanetaryHours = useMemo<WebsitePlanetaryHourRow[]>(() => {
    if (!sunData || !fullPlanetarySchedules) {
      return [];
    }

    return getVisiblePlanetaryHours(fullPlanetarySchedules, sunData, now).hours;
  }, [sunData, fullPlanetarySchedules, now]);

  const planetaryHoursTitle = useMemo(() => {
    if (!sunData || !fullPlanetarySchedules) {
      return "Today's Planetary Hours";
    }

    return getVisiblePlanetaryHours(fullPlanetarySchedules, sunData, now).title;
  }, [sunData, fullPlanetarySchedules, now]);

  const planetaryHourSummary = useMemo(
    () => buildPlanetaryHourSummary(completePlanetarySchedule, now),
    [completePlanetarySchedule, now],
  );

  const isScheduleLoading = !selectedLocation || !sunData || !fullPlanetarySchedules;
  const isContentLoading = requiredContentDays.some((dayOfWeek) =>
    contentLoadingDays.has(dayOfWeek),
  );
  const hasContentError = requiredContentDays.some((dayOfWeek) =>
    contentFailedDays.has(dayOfWeek),
  );
  const contentStatus = isContentLoading
    ? 'Loading descriptions and suggestions...'
    : hasContentError
      ? 'Descriptions and suggestions are unavailable right now.'
      : '';
  const hasScheduleError =
    Boolean(selectedLocation) &&
    (sunDataStatus === 'Unable to load sunrise and sunset right now.' ||
      (Boolean(sunData) && !fullPlanetarySchedules));

  return (
    <main className="app-shell">
      <SolarSystemBackground />
      <div className="page-layer">
        <Header
          dateTimeLabel={dateTimeLabel}
          location={selectedLocation}
          onSelectLocation={handleManualLocationSelected}
          openLocationSelector={openLocationSelector}
        />
        <section className="content">
          <DayNightInfoCard
            location={selectedLocation}
            now={now}
            onRetry={retrySunData}
            status={sunDataStatus}
            sunData={sunData}
          />
          <SummaryCards
            currentHour={planetaryHourSummary.currentHour}
            nextHour={planetaryHourSummary.nextHour}
            timeRemainingMilliseconds={calculateCountdownToHourEnd(planetaryHourSummary.currentHour)}
            isLoading={isScheduleLoading}
            hasError={hasScheduleError}
            timezone={selectedLocation?.timezone ?? null}
          />
          <PlanetaryHoursTable
            hours={visiblePlanetaryHours}
            title={planetaryHoursTitle}
            activeHourNumber={planetaryHourSummary.currentHour?.hour ?? null}
            timezone={selectedLocation?.timezone ?? null}
            contentStatus={contentStatus}
          />
        </section>
        <Footer />
      </div>
    </main>
  );
}

function App() {
  if (window.location.pathname === '/about') {
    return <AboutPage />;
  }

  if (window.location.pathname === '/privacy') {
    return <PrivacyPolicyPage />;
  }

  if (window.location.pathname === '/disclaimer') {
    return <DisclaimerPage />;
  }

  if (window.location.pathname === '/terms') {
    return <TermsOfUsePage />;
  }

  if (window.location.pathname === '/contact') {
    return <ContactPage />;
  }

  return <HomePage />;
}

export default App;

function mergeScheduleWithContent(
  schedule: PlanetaryHourScheduleRow[],
  content: WebsitePlanetaryHourContent[] | undefined,
): WebsitePlanetaryHourRow[] {
  return schedule.map((hour) => {
    const matchingContent = content?.find((item) => item.hourNumber === hour.hour);

    return {
      ...hour,
      description: matchingContent?.description ?? '',
      suggestion: matchingContent?.suggestion ?? '',
    };
  });
}

function getBackendDayOfWeek(date: Date, timezone: string) {
  const dateKey = getDateKeyInTimezone(date, timezone);
  const weekday = new Date(`${dateKey}T12:00:00.000Z`).getUTCDay();

  return weekday === 0 ? 7 : weekday;
}

function uniqueNumbers(values: number[]) {
  return Array.from(new Set(values));
}
