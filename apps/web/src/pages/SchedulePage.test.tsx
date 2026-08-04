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
    window.history.replaceState({}, '', '/schedule');

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
    expect(window.location.pathname).toBe('/schedule');
    expect(window.location.search).toBe('');

    fireEvent.click(screen.getByRole('button', { name: 'Next Day' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next Day' }));
    expect(await screen.findByText('Tuesday, July 21, 2026')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/schedule');
    expect(window.location.search).toBe('');

    fireEvent.click(screen.getByRole('button', { name: 'Today' }));
    expect(await screen.findByText('Monday, July 20, 2026')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/schedule');
    expect(window.location.search).toBe('');
  });

  it('renders concise crawlable explanation and a single page h1', async () => {
    render(
      <SchedulePage
        dateTimeLabel="Monday, July 20, 2026 - 12:00 PM UTC"
        location={location}
        now={new Date('2026-07-20T12:00:00.000Z')}
        onSelectLocation={() => undefined}
        openLocationSelector={false}
      />,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Planetary Hours Schedule Table' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 2, name: 'How the Schedule Table works' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Selected Daytime Planetary Hours' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Selected Nighttime Planetary Hours' })).toBeInTheDocument();
    expect(screen.getByText(/12 planetary hours from sunrise to sunset/i)).toBeInTheDocument();
    expect(screen.getByText(/sunset to the following sunrise/i)).toBeInTheDocument();
    expect(screen.getByText(/traditional Chaldean order/i)).toBeInTheDocument();
  });
});
