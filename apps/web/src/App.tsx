import { useEffect, useMemo, useState } from 'react';
import { Header } from './components/Header';
import { DayNightInfoCard } from './components/DayNightInfoCard';
import { SummaryCards } from './components/SummaryCards';
import { PlanetaryHoursTable } from './components/PlanetaryHoursTable';
import { CurrentHourSuggestion } from './components/CurrentHourSuggestion';
import { SolarSystemBackground } from './components/SolarSystemBackground';
import { Footer } from './components/Footer';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { DisclaimerPage } from './pages/DisclaimerPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { SchedulePage } from './pages/SchedulePage';
import { TermsOfUsePage } from './pages/TermsOfUsePage';
import {
  buildPlanetaryHourSummary,
  calculateCountdownToHourEnd,
  generatePlanetaryHoursSchedule,
  getVisiblePlanetaryHours,
} from '@planetary-hours/planetary-engine';
import type { SelectedLocation } from './services/locationService';
import { useDayNightSunData } from './hooks/useDayNightSunData';
import { useSelectedLocation } from './hooks/useSelectedLocation';
import { useZonedClock } from './hooks/useZonedClock';
import { getPlanetaryHours } from './api/planetary-hours';
import {
  getBackendDayOfWeek,
  mergeScheduleWithContent,
  uniqueNumbers,
} from './utils/planetaryContent';
import { usePageSeo } from './seo/usePageSeo';
import type {
  WebsitePlanetaryHourContent,
  WebsitePlanetaryHourRow,
} from './types/planetaryHoursContent';

type ContentByDay = Partial<Record<number, WebsitePlanetaryHourContent[]>>;

type HomePageProps = {
  dateTimeLabel: string;
  selectedLocation: SelectedLocation | null;
  now: Date;
  onSelectLocation: (location: SelectedLocation) => void;
  openLocationSelector: boolean;
};

function HomePage({
  dateTimeLabel,
  selectedLocation,
  now,
  onSelectLocation,
  openLocationSelector,
}: HomePageProps) {
  const [contentByDay, setContentByDay] = useState<ContentByDay>({});
  const [contentLoadingDays, setContentLoadingDays] = useState<Set<number>>(() => new Set());
  const [contentFailedDays, setContentFailedDays] = useState<Set<number>>(() => new Set());
  const {
    retry: retrySunData,
    status: sunDataStatus,
    sunData,
  } = useDayNightSunData(selectedLocation, now);

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
          onSelectLocation={onSelectLocation}
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
            currentHour={planetaryHourSummary.currentHour as WebsitePlanetaryHourRow | null}
            nextHour={planetaryHourSummary.nextHour}
            timeRemainingMilliseconds={calculateCountdownToHourEnd(planetaryHourSummary.currentHour)}
            isLoading={isScheduleLoading}
            hasError={hasScheduleError}
            timezone={selectedLocation?.timezone ?? null}
          />
          <CurrentHourSuggestion
            currentHour={planetaryHourSummary.currentHour as WebsitePlanetaryHourRow | null}
            hasError={hasScheduleError || hasContentError}
            isLoading={isScheduleLoading || isContentLoading}
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
  const pathname = window.location.pathname;

  usePageSeo(pathname);

  if (pathname === '/about') {
    return <AboutPage />;
  }

  if (pathname === '/privacy') {
    return <PrivacyPolicyPage />;
  }

  if (pathname === '/disclaimer') {
    return <DisclaimerPage />;
  }

  if (pathname === '/terms') {
    return <TermsOfUsePage />;
  }

  if (pathname === '/contact') {
    return <ContactPage />;
  }

  return <LocationAwareRoute pathname={pathname} />;
}

function LocationAwareRoute({ pathname }: { pathname: string }) {
  const {
    selectedLocation,
    openLocationSelector,
    handleLocationSelected,
  } = useSelectedLocation();
  const { currentDate, currentTime, now } = useZonedClock(selectedLocation?.timezone);
  const dateTimeLabel = useMemo(() => {
    if (!currentDate || !currentTime) {
      return 'Local time loading...';
    }

    return `${currentDate} - ${currentTime}`;
  }, [currentDate, currentTime]);

  if (pathname === '/schedule') {
    return (
      <SchedulePage
        dateTimeLabel={dateTimeLabel}
        location={selectedLocation}
        now={now}
        onSelectLocation={handleLocationSelected}
        openLocationSelector={openLocationSelector}
      />
    );
  }

  return (
    <HomePage
      dateTimeLabel={dateTimeLabel}
      selectedLocation={selectedLocation}
      now={now}
      onSelectLocation={handleLocationSelected}
      openLocationSelector={openLocationSelector}
    />
  );
}

export default App;
