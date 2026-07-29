import {
  generatePlanetaryHoursSchedule,
  type PlanetaryHourScheduleRow,
  type PlanetaryHoursEngineInput,
} from '@planetary-hours/planetary-engine'

export type AdminPlanetaryHourSequenceRow = Pick<PlanetaryHourScheduleRow, 'hour' | 'planet'>

export function buildAdminPlanetaryHourSequence(
  input: PlanetaryHoursEngineInput,
): AdminPlanetaryHourSequenceRow[] {
  return generatePlanetaryHoursSchedule(input).schedule.map(({ hour, planet }) => ({
    hour,
    planet,
  }))
}
