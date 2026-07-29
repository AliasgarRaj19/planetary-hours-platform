import type { PlanetaryHourScheduleRow } from '@planetary-hours/planetary-engine';

export type WebsitePlanetaryHourContent = {
  hourNumber: number;
  description: string;
  suggestion: string;
};

export type WebsitePlanetaryHourRow = PlanetaryHourScheduleRow & {
  description?: string;
  suggestion?: string;
};
