import { daysOfWeek } from '../dayConfig'
import type { DayOfWeek } from '../types'

type DayTabsProps = {
  selectedDay: DayOfWeek
  onSelectDay: (day: DayOfWeek) => void
}

export function DayTabs({ selectedDay, onSelectDay }: DayTabsProps) {
  return (
    <div className="day-tabs" role="tablist" aria-label="Select day of week">
      {daysOfWeek.map((day) => (
        <button
          aria-selected={selectedDay === day.value}
          className={`day-tab${selectedDay === day.value ? ' active' : ''}`}
          key={day.value}
          onClick={() => onSelectDay(day.value)}
          role="tab"
          type="button"
        >
          {day.label}
        </button>
      ))}
    </div>
  )
}
