export type PlanetaryHourContent = {
  hourNumber: number;
  description: string;
  suggestion: string;
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '');

export async function getPlanetaryHours(
  dayOfWeek: number,
  signal?: AbortSignal,
): Promise<PlanetaryHourContent[]> {
  if (!API_BASE_URL) {
    throw new Error('Mobile API URL is not configured.');
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/planetary-hours/${dayOfWeek}`, {
    signal,
  });

  if (!response.ok) {
    throw new Error(`Unable to load planetary hour content: ${response.status}`);
  }

  return (await response.json()) as PlanetaryHourContent[];
}
