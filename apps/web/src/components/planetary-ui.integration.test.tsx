import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SummaryCards } from './SummaryCards';
import { PlanetaryHoursTable } from './PlanetaryHoursTable';
import { generatePlanetaryHoursSchedule } from '@planetary-hours/planetary-engine';

describe('planetary hours UI integration', () => {
  const schedule = generatePlanetaryHoursSchedule({
    sunriseTime: '2026-07-19T06:00:00.000Z',
    sunsetTime: '2026-07-19T18:00:00.000Z',
    nextSunriseTime: '2026-07-20T06:00:00.000Z',
    date: '2026-07-19T06:00:00.000Z',
    timezone: 'UTC',
  }).schedule;

  it('renders synchronized summary cards from engine rows', () => {
    render(
      <SummaryCards
        currentHour={schedule[4]}
        nextHour={schedule[5]}
        timeRemainingMilliseconds={38 * 60 * 1000 + 14 * 1000}
        isLoading={false}
        hasError={false}
        timezone="UTC"
      />,
    );

    expect(screen.getByText('Current Planetary Hour')).toBeInTheDocument();
    expect(screen.getByText(schedule[4].planet)).toBeInTheDocument();
    expect(screen.getByText(/Hour 5/)).toBeInTheDocument();
    expect(screen.getByText('00:38:14')).toBeInTheDocument();
    expect(screen.getByText(/Hour 6/)).toBeInTheDocument();
  });

  it('renders exactly 12 table rows and highlights the active row', () => {
    render(
      <PlanetaryHoursTable
        activeHourNumber={3}
        hours={schedule.slice(0, 12)}
        timezone="UTC"
        title="Today's Daytime Planetary Hours"
      />,
    );

    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(13);
    expect(screen.getByRole('heading', { name: "Today's Daytime Planetary Hours" })).toBeInTheDocument();

    const activeRow = rows.find((row) => within(row).queryByText('3'));
    expect(activeRow).toHaveClass('active-hour-row');
  });

  it('shows unavailable states instead of fabricated planetary data', () => {
    render(
      <SummaryCards
        currentHour={null}
        nextHour={null}
        timeRemainingMilliseconds={null}
        isLoading={false}
        hasError
        timezone="UTC"
      />,
    );

    expect(screen.getAllByText('Unavailable')).toHaveLength(3);
    expect(screen.getAllByText('Planetary hour data unavailable')).toHaveLength(3);
  });
});
