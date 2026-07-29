import { HourRow } from './HourRow'
import type { EditablePlanetaryHourField, PlanetaryHourEditorRow } from '../types'

type HoursTableProps = {
  rows: PlanetaryHourEditorRow[]
  onChange: (hourNumber: number, field: EditablePlanetaryHourField, value: string) => void
}

export function HoursTable({ rows, onChange }: HoursTableProps) {
  return (
    <div className="editor-table-panel">
      <table className="hours-table">
        <thead>
          <tr>
            <th scope="col">Hour</th>
            <th scope="col">Planet</th>
            <th scope="col">Description</th>
            <th scope="col">Suggestion</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <HourRow key={row.hour} onChange={onChange} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
