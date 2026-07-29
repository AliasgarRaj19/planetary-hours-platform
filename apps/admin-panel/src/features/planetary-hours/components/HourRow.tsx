import type { EditablePlanetaryHourField, PlanetaryHourEditorRow } from '../types'

type HourRowProps = {
  row: PlanetaryHourEditorRow
  onChange: (hourNumber: number, field: EditablePlanetaryHourField, value: string) => void
}

export function HourRow({ row, onChange }: HourRowProps) {
  return (
    <tr>
      <td className="hour-number">Hour {row.hour}</td>
      <td>
        <span className="planet-pill">{row.planet}</span>
      </td>
      <td>
        <textarea
          aria-label={`Description for hour ${row.hour}`}
          onChange={(event) => onChange(row.hour, 'description', event.target.value)}
          placeholder="Add description"
          value={row.content.description}
        />
      </td>
      <td>
        <textarea
          aria-label={`Suggestion for hour ${row.hour}`}
          onChange={(event) => onChange(row.hour, 'suggestion', event.target.value)}
          placeholder="Add suggestion"
          value={row.content.suggestion}
        />
      </td>
    </tr>
  )
}
