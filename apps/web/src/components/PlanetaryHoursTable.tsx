import { formatTimeInTimezone } from '../utils/timeFormatting';
import type { WebsitePlanetaryHourRow } from '../types/planetaryHoursContent';

type PlanetaryHoursTableProps = {
  hours: WebsitePlanetaryHourRow[];
  title: string;
  activeHourNumber: number | null;
  timezone: string | null;
  contentStatus?: string;
};

export function PlanetaryHoursTable({
  hours,
  title,
  activeHourNumber,
  timezone,
  contentStatus = '',
}: PlanetaryHoursTableProps) {
  return (
    <section className="table-section">
      <div className="section-heading">
        <p className="eyebrow">Today</p>
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
              <th>Hour</th>
              <th>Planet</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Description</th>
              <th>Suggestion</th>
            </tr>
          </thead>
          <tbody>
            {hours.length > 0 ? (
              hours.map((hour) => (
                <tr
                  className={hour.hour === activeHourNumber ? 'active-hour-row' : undefined}
                  key={hour.hour}
                >
                  <td>{hour.hour}</td>
                  <td>
                    <span className="planet-name">{hour.planet}</span>
                  </td>
                  <td>{timezone ? formatTimeInTimezone(hour.startTime, timezone) : ''}</td>
                  <td>{timezone ? formatTimeInTimezone(hour.endTime, timezone) : ''}</td>
                  <td>{hour.description ?? ''}</td>
                  <td>{hour.suggestion ?? ''}</td>
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
