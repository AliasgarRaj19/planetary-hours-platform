import { DayTabs } from './components/DayTabs'
import { HoursTable } from './components/HoursTable'
import { SaveBar } from './components/SaveBar'
import { usePlanetaryHourEditor } from './hooks/usePlanetaryHourEditor'

export function PlanetaryHoursPage() {
  const {
    errorMessage,
    hasUnsavedChanges,
    isLoading,
    isSaving,
    rows,
    saveChanges,
    selectedDay,
    setSelectedDay,
    showSaveSuccess,
    updateHourContent,
  } = usePlanetaryHourEditor()

  return (
    <section className="page-section planetary-editor">
      <div className="page-heading">
        <p className="section-kicker">Content editor</p>
        <h2>Planetary Hours</h2>
        <p>
          Edit the description and suggestion copy for each planetary hour. Hour and planet values
          are generated from the shared planetary engine.
        </p>
      </div>

      <DayTabs onSelectDay={setSelectedDay} selectedDay={selectedDay} />
      {errorMessage ? (
        <p className="editor-message error" role="alert">
          {errorMessage}
        </p>
      ) : null}
      {isLoading ? (
        <p className="editor-message" aria-live="polite">
          Loading planetary hour content...
        </p>
      ) : null}
      <HoursTable onChange={updateHourContent} rows={rows} />
      <SaveBar
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        onSave={saveChanges}
        showSaveSuccess={showSaveSuccess}
      />
    </section>
  )
}
