import {
  formatCountdown,
  type PlanetaryHourScheduleRow,
} from '@planetary-hours/planetary-engine';
import { formatTimeInTimezone } from '../utils/timeFormatting';

type SummaryCardsProps = {
  currentHour: PlanetaryHourScheduleRow | null;
  nextHour: PlanetaryHourScheduleRow | null;
  timeRemainingMilliseconds: number | null;
  isLoading: boolean;
  hasError: boolean;
  timezone: string | null;
};

export function SummaryCards({
  currentHour,
  nextHour,
  timeRemainingMilliseconds,
  isLoading,
  hasError,
  timezone,
}: SummaryCardsProps) {
  return (
    <section className="summary-grid" aria-label="Planetary hour summary">
      <PlanetaryHourCard
        title="Current Planetary Hour"
        hour={currentHour}
        isLoading={isLoading}
        hasError={hasError}
        timezone={timezone}
      />
      <article className="summary-card" key="Time Remaining">
        <p>Time Remaining</p>
        <strong className="countdown-value">
          {hasError ? 'Unavailable' : isLoading ? 'Loading' : formatCountdown(timeRemainingMilliseconds)}
        </strong>
        <span>{hasError ? 'Planetary hour data unavailable' : 'Until this hour ends'}</span>
      </article>
      <PlanetaryHourCard
        title="Next Planetary Hour"
        hour={nextHour}
        isLoading={isLoading}
        hasError={hasError}
        timezone={timezone}
      />
    </section>
  );
}

type PlanetaryHourCardProps = {
  title: string;
  hour: PlanetaryHourScheduleRow | null;
  isLoading: boolean;
  hasError: boolean;
  timezone: string | null;
};

function PlanetaryHourCard({
  title,
  hour,
  isLoading,
  hasError,
  timezone,
}: PlanetaryHourCardProps) {
  const detail = hour && timezone
    ? `Hour ${hour.hour} | ${formatTimeInTimezone(hour.startTime, timezone)} - ${formatTimeInTimezone(hour.endTime, timezone)}`
    : hasError
      ? 'Planetary hour data unavailable'
      : 'Loading schedule';

  return (
    <article className="summary-card">
      <p>{title}</p>
      <strong>{hasError ? 'Unavailable' : hour ? hour.planet : isLoading ? 'Loading' : 'Unavailable'}</strong>
      <span>{detail}</span>
    </article>
  );
}
