import type { AdminPlanetaryHourSequenceRow } from '../../engine/planetaryEngine'

export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7

export type PlanetaryHourContent = {
  dayOfWeek: DayOfWeek
  hourNumber: number
  description: string
  suggestion: string
}

export type PlanetaryHourEditorRow = AdminPlanetaryHourSequenceRow & {
  content: PlanetaryHourContent
}

export type EditablePlanetaryHourField = 'description' | 'suggestion'
