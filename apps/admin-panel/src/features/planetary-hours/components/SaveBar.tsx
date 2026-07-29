type SaveBarProps = {
  hasUnsavedChanges: boolean
  isSaving: boolean
  showSaveSuccess: boolean
  onSave: () => void
}

export function SaveBar({
  hasUnsavedChanges,
  isSaving,
  onSave,
  showSaveSuccess,
}: SaveBarProps) {
  return (
    <div className="save-bar" aria-live="polite">
      <div>
        <p className={`save-state${hasUnsavedChanges ? ' dirty' : ' saved'}`}>
          {hasUnsavedChanges ? '● Unsaved changes' : '✓ All changes saved'}
        </p>
        {showSaveSuccess ? <p className="save-toast">Changes saved.</p> : null}
      </div>
      <button disabled={!hasUnsavedChanges || isSaving} onClick={onSave} type="button">
        {isSaving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  )
}
