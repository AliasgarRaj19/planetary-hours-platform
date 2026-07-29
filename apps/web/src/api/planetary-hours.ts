import type { WebsitePlanetaryHourContent } from '../types/planetaryHoursContent';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '');

export async function getPlanetaryHours(dayOfWeek: number, signal?: AbortSignal) {
  if (!API_BASE_URL) {
    throw new Error('Website API URL is not configured.');
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/planetary-hours/${dayOfWeek}`, {
    signal,
  });

  if (!response.ok) {
    throw new Error(`Unable to load planetary hour content: ${response.status}`);
  }

  return response.json() as Promise<WebsitePlanetaryHourContent[]>;
}
