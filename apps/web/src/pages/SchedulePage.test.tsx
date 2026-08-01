import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SchedulePage } from './SchedulePage';
import type { SelectedLocation } from '../services/locationService';

vi.mock('../api/planetary-hours', () => ({
  getPlanetaryHours: vi.fn(() => Promise.resolve([])),
}));

describe('SchedulePage', () => {
  const location: SelectedLocation = {
    city: 'Greenwich',
    country: 'United Kingdom',
    displayName: 'Greenwich, United Kingdom',
    latitude: 51.4769,
    longitude: 0,
    source: 'manual',
    state: 'England',
    timezone: 'UTC',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('navigates schedule dates and resets to today', async () => {
    render(
      <SchedulePage
        dateTimeLabel="Monday, July 20, 2026 - 12:00 PM UTC"
        location={location}
        now={new Date('2026-07-20T12:00:00.000Z')}
        onSelectLocation={() => undefined}
        openLocationSelector={false}
      />,
    );

    expect(await screen.findByText('Monday, July 20, 2026')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Previous Day' }));
    expect(await screen.findByText('Sunday, July 19, 2026')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next Day' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next Day' }));
    expect(await screen.findByText('Tuesday, July 21, 2026')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Today' }));
    expect(await screen.findByText('Monday, July 20, 2026')).toBeInTheDocument();
  });
});
