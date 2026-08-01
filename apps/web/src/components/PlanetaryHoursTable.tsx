import { formatTimeInTimezone } from '../utils/timeFormatting';
import type { WebsitePlanetaryHourRow } from '../types/planetaryHoursContent';

type PlanetaryHoursTableProps = {
  hours: WebsitePlanetaryHourRow[];
  title: string;
  activeHourNumber: number | null;
  timezone: string | null;
  contentStatus?: string;
  periodLabel?: string;
};

export function PlanetaryHoursTable({
  hours,
  title,
  activeHourNumber,
  timezone,
  contentStatus = '',
  periodLabel = 'Today',
}: PlanetaryHoursTableProps) {
  return (
    <section className="table-section">
      <div className="section-heading">
        <p className="eyebrow">{periodLabel}</p>
        <h2>{title}</h2>
        {contentStatus ? (
          <p className="table-status" role="status">
            {contentStatus}
          </p>
        ) : null}
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th className="col-hour">Hour</th>
              <th className="col-planet">Planet</th>
              <th className="col-time">Start Time</th>
              <th className="col-time">End Time</th>
              <th className="col-content">Description</th>
              <th className="col-content">Suggestion</th>
            </tr>
          </thead>
          <tbody>
            {hours.length > 0 ? (
              hours.map((hour) => (
                <tr
                  className={hour.hour === activeHourNumber ? 'active-hour-row' : undefined}
                  key={hour.hour}
                >
                  <td className="cell-compact">{hour.hour}</td>
                  <td className="cell-compact">
                    <span className="planet-name">{hour.planet}</span>
                  </td>
                  <td className="cell-compact">
                    {timezone ? formatTimeInTimezone(hour.startTime, timezone) : ''}
                  </td>
                  <td className="cell-compact">
                    {timezone ? formatTimeInTimezone(hour.endTime, timezone) : ''}
                  </td>
                  <td className="cell-long-text">{hour.description ?? ''}</td>
                  <td className="cell-long-text">{hour.suggestion ?? ''}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6}>Select a location to load planetary hours.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
