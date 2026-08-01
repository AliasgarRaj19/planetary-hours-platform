import { useEffect, useMemo, useState } from 'react';
import {
  calculateSunTimesForDate,
  generatePlanetaryHoursSchedule,
  getDateKeyInTimezone,
  offsetDateKey,
  zonedDateTimeToUtcDate,
} from '@planetary-hours/planetary-engine';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { PlanetaryHoursTable } from '../components/PlanetaryHoursTable';
import { SolarSystemBackground } from '../components/SolarSystemBackground';
import { getPlanetaryHours } from '../api/planetary-hours';
import type { SelectedLocation } from '../services/locationService';
import type {
  WebsitePlanetaryHourContent,
  WebsitePlanetaryHourRow,
} from '../types/planetaryHoursContent';
import { getBackendDayOfWeek, mergeScheduleWithContent } from '../utils/planetaryContent';

type SchedulePageProps = {
  dateTimeLabel: string;
  location: SelectedLocation | null;
  now: Date;
  onSelectLocation: (location: SelectedLocation) => void;
  openLocationSelector: boolean;
};

export function SchedulePage({
  dateTimeLabel,
  location,
  now,
  onSelectLocation,
  openLocationSelector,
}: SchedulePageProps) {
  const todayDateKey = location ? getDateKeyInTimezone(now, location.timezone) : '';
  const [selectedDateKey, setSelectedDateKey] = useState(todayDateKey);
  const [content, setContent] = useState<WebsitePlanetaryHourContent[]>([]);
  const [contentStatus, setContentStatus] = useState('');

  useEffect(() => {
    if (!selectedDateKey && todayDateKey) {
      setSelectedDateKey(todayDateKey);
    }
  }, [selectedDateKey, todayDateKey]);

  const scheduleResult = useMemo(() => {
    if (!location || !selectedDateKey) {
      return null;
    }

    const coordinates = {
      latitude: location.latitude,
      longitude: location.longitude,
    };
    const todaySunTimes = calculateSunTimesForDate({
      coordinates,
      date: selectedDateKey,
      timezone: location.timezone,
    });
    const nextSunTimes = calculateSunTimesForDate({
      coordinates,
      date: offsetDateKey(selectedDateKey, 1),
      timezone: location.timezone,
    });
    const date = zonedDateTimeToUtcDate({
      date: selectedDateKey,
      hour: 12,
      minute: 0,
      second: 0,
      timezone: location.timezone,
    });

    return generatePlanetaryHoursSchedule({
      sunriseTime: todaySunTimes.sunrise,
      sunsetTime: todaySunTimes.sunset,
      nextSunriseTime: nextSunTimes.sunrise,
      date,
      timezone: location.timezone,
    }).schedule;
  }, [location, selectedDateKey]);

  const selectedDayOfWeek = useMemo(() => {
    if (!location || !selectedDateKey) {
      return null;
    }

    return getBackendDayOfWeek(
      zonedDateTimeToUtcDate({
        date: selectedDateKey,
        hour: 12,
        minute: 0,
        second: 0,
        timezone: location.timezone,
      }),
      location.timezone,
    );
  }, [location, selectedDateKey]);

  useEffect(() => {
    if (!selectedDayOfWeek) {
      setContent([]);
      setContentStatus('');
      return undefined;
    }

    const controller = new AbortController();
    setContentStatus('Loading descriptions and suggestions...');

    getPlanetaryHours(selectedDayOfWeek, controller.signal)
      .then((nextContent) => {
        if (controller.signal.aborted) {
          return;
        }

        setContent(nextContent);
        setContentStatus('');
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        setContent([]);
        setContentStatus('Descriptions and suggestions are unavailable right now.');
      });

    return () => controller.abort();
  }, [selectedDayOfWeek]);

  const mergedSchedule = useMemo<WebsitePlanetaryHourRow[]>(
    () => (scheduleResult ? mergeScheduleWithContent(scheduleResult, content) : []),
    [content, scheduleResult],
  );

  const selectedDateLabel = useMemo(() => {
    if (!location || !selectedDateKey) {
      return 'Select a location to load the schedule.';
    }

    return new Intl.DateTimeFormat('en', {
      dateStyle: 'full',
      timeZone: location.timezone,
    }).format(
      zonedDateTimeToUtcDate({
        date: selectedDateKey,
        hour: 12,
        minute: 0,
        second: 0,
        timezone: location.timezone,
      }),
    );
  }, [location, selectedDateKey]);

  function moveSelectedDate(offset: number) {
    setSelectedDateKey((currentDateKey) =>
      currentDateKey ? offsetDateKey(currentDateKey, offset) : todayDateKey,
    );
  }

  return (
    <main className="app-shell">
      <SolarSystemBackground />
      <div className="page-layer">
        <Header
          dateTimeLabel={dateTimeLabel}
          location={location}
          onSelectLocation={onSelectLocation}
          openLocationSelector={openLocationSelector}
        />
        <section className="content schedule-page">
          <div className="schedule-header-card">
            <div>
              <p className="eyebrow">Full Schedule</p>
              <h2>Planetary Hours Schedule</h2>
              <p>{selectedDateLabel}</p>
            </div>
            <div className="schedule-controls" aria-label="Schedule date navigation">
              <button type="button" onClick={() => moveSelectedDate(-1)}>
                Previous Day
              </button>
              <button type="button" onClick={() => setSelectedDateKey(todayDateKey)}>
                Today
              </button>
              <button type="button" onClick={() => moveSelectedDate(1)}>
                Next Day
              </button>
            </div>
          </div>

          <PlanetaryHoursTable
            activeHourNumber={null}
            contentStatus={contentStatus}
            hours={mergedSchedule.slice(0, 12)}
            periodLabel="Daytime Hours"
            timezone={location?.timezone ?? null}
            title="Selected Daytime Planetary Hours"
          />
          <PlanetaryHoursTable
            activeHourNumber={null}
            contentStatus={contentStatus}
            hours={mergedSchedule.slice(12, 24)}
            periodLabel="Nighttime Hours"
            timezone={location?.timezone ?? null}
            title="Selected Nighttime Planetary Hours"
          />
        </section>
        <Footer />
      </div>
    </main>
  );
}
