import { useMemo } from 'react';
import type { SelectedLocation } from '../services/locationService';
import {
  buildDayNightInfo,
  type DayNightInfo,
  type DayNightSunData,
} from '../services/sunriseSunsetService';

type DayNightInfoCardProps = {
  location: SelectedLocation | null;
  now: Date;
  status: string;
  sunData: DayNightSunData | null;
  onRetry: () => void;
};

export function DayNightInfoCard({
  location,
  now,
  onRetry,
  status,
  sunData,
}: DayNightInfoCardProps) {
  const info = useMemo<DayNightInfo | null>(() => {
    if (!location || !sunData) {
      return null;
    }

    return buildDayNightInfo(location, now, sunData);
  }, [location, now, sunData]);

  return (
    <section className="day-night-card" aria-label="Day and night information">
      <div>
        <h2>{info?.period === 'day' ? 'Current Daylight Window' : 'Current Night Window'}</h2>
      </div>
      {info ? (
        info.period === 'day' ? (
          <div className="sun-time-grid">
            <article>
              <p>{info.sunrise.label}</p>
              <strong>{info.sunrise.time}</strong>
            </article>
            <article>
              <p>{info.sunset.label}</p>
              <strong>{info.sunset.time}</strong>
            </article>
          </div>
        ) : (
          <div className="sun-time-grid">
            <article>
              <p>{info.sunset.label}</p>
              <strong>{info.sunset.time}</strong>
            </article>
            <article>
              <p>{info.sunrise.label}</p>
              <strong>{info.sunrise.time}</strong>
            </article>
          </div>
        )
      ) : (
        <div className="sun-time-status">
          <p className="location-status">{status}</p>
          {status === 'Unable to load sunrise and sunset right now.' && (
            <button type="button" onClick={onRetry}>
              Retry
            </button>
          )}
        </div>
      )}
    </section>
  );
}
