import type { PlanetaryHour } from '../data/planetaryHours';

type PlanetaryHoursTableProps = {
  hours: PlanetaryHour[];
};

export function PlanetaryHoursTable({ hours }: PlanetaryHoursTableProps) {
  return (
    <section className="table-section">
      <div className="section-heading">
        <p className="eyebrow">Today</p>
        <h2>Today's Planetary Hours</h2>
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
            {hours.map((hour) => (
              <tr key={hour.hour}>
                <td>{hour.hour}</td>
                <td>
                  <span className="planet-name">{hour.planet}</span>
                </td>
                <td>{hour.startTime}</td>
                <td>{hour.endTime}</td>
                <td>Coming Soon</td>
                <td>Coming Soon</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
