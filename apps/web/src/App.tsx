import { useEffect, useMemo, useState } from 'react';
import { Header } from './components/Header';
import { DayNightInfoCard } from './components/DayNightInfoCard';
import { SummaryCards } from './components/SummaryCards';
import { PlanetaryHoursTable } from './components/PlanetaryHoursTable';
import { SolarSystemBackground } from './components/SolarSystemBackground';
import {
  generatePlanetaryHoursSchedule,
  type PlanetaryHourScheduleRow,
} from './engine/planetaryHoursEngine';
import {
  buildPlanetaryHourSummary,
  getVisiblePlanetaryHours,
} from './engine/planetaryHourSelectors';
import {
  getBrowserPosition,
  reverseGeocodeCoordinates,
  type SelectedLocation,
} from './services/locationService';
import { useDayNightSunData } from './hooks/useDayNightSunData';
import { useZonedClock } from './hooks/useZonedClock';

function App() {
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [openLocationSelector, setOpenLocationSelector] = useState(false);
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

  const fullPlanetarySchedules = useMemo(() => {
    if (!selectedLocation || !sunData) {
      return null;
    }

    try {
      const todaySchedule = generatePlanetaryHoursSchedule({
        sunriseTime: sunData.today.sunrise,
        sunsetTime: sunData.today.sunset,
        nextSunriseTime: sunData.tomorrow.sunrise,
        date: sunData.today.sunrise,
        timezone: selectedLocation.timezone,
      }).schedule;

      const yesterdaySchedule = generatePlanetaryHoursSchedule({
        sunriseTime: sunData.yesterday.sunrise,
        sunsetTime: sunData.yesterday.sunset,
        nextSunriseTime: sunData.today.sunrise,
        date: sunData.yesterday.sunrise,
        timezone: selectedLocation.timezone,
      }).schedule;

      const tomorrowSchedule = generatePlanetaryHoursSchedule({
        sunriseTime: sunData.tomorrow.sunrise,
        sunsetTime: sunData.tomorrow.sunset,
        date: sunData.tomorrow.sunrise,
        timezone: selectedLocation.timezone,
      }).schedule;

      return {
        todaySchedule,
        tomorrowSchedule,
        yesterdaySchedule,
      };
    } catch {
      return null;
    }
  }, [selectedLocation, sunData]);

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

  const visiblePlanetaryHours = useMemo<PlanetaryHourScheduleRow[]>(() => {
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
            timeRemainingMilliseconds={planetaryHourSummary.timeRemainingMilliseconds}
            isLoading={isScheduleLoading}
            hasError={hasScheduleError}
            timezone={selectedLocation?.timezone ?? null}
          />
          <PlanetaryHoursTable
            hours={visiblePlanetaryHours}
            title={planetaryHoursTitle}
            activeHourNumber={planetaryHourSummary.currentHour?.hour ?? null}
            timezone={selectedLocation?.timezone ?? null}
          />
        </section>
      </div>
    </main>
  );
}

export default App;
