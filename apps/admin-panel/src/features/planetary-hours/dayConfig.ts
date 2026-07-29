import type { DayOfWeek } from './types'

export const daysOfWeek: Array<{ dateKey: string; label: string; value: DayOfWeek }> = [
  { label: 'Monday', value: 1, dateKey: '2026-07-20' },
  { label: 'Tuesday', value: 2, dateKey: '2026-07-21' },
  { label: 'Wednesday', value: 3, dateKey: '2026-07-22' },
  { label: 'Thursday', value: 4, dateKey: '2026-07-23' },
  { label: 'Friday', value: 5, dateKey: '2026-07-24' },
  { label: 'Saturday', value: 6, dateKey: '2026-07-25' },
  { label: 'Sunday', value: 7, dateKey: '2026-07-26' },
]

export const defaultSelectedDay: DayOfWeek = 1

export function getDayDateKey(dayOfWeek: DayOfWeek) {
  const day = daysOfWeek.find((item) => item.value === dayOfWeek)

  if (!day) {
    throw new Error('Unsupported day selected')
  }

  return day.dateKey
}
