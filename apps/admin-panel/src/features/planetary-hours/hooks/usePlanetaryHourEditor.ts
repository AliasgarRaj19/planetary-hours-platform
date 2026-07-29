import { useEffect, useMemo, useState } from 'react'
import {
  getPlanetaryHoursWithSignal,
  updatePlanetaryHours,
} from '../../../api/planetary-hours'
import { buildAdminPlanetaryHourSequence } from '../../../engine/planetaryEngine'
import { defaultSelectedDay, getDayDateKey } from '../dayConfig'
import type {
  DayOfWeek,
  EditablePlanetaryHourField,
  PlanetaryHourContent,
  PlanetaryHourEditorRow,
} from '../types'

const editorTimezone = 'UTC'

function buildSequenceForDay(dayOfWeek: DayOfWeek) {
  const dateKey = getDayDateKey(dayOfWeek)

  return buildAdminPlanetaryHourSequence({
    sunriseTime: `${dateKey}T06:00:00.000Z`,
    sunsetTime: `${dateKey}T18:00:00.000Z`,
    nextSunriseTime: `${getNextDateKey(dateKey)}T06:00:00.000Z`,
    date: `${dateKey}T06:00:00.000Z`,
    timezone: editorTimezone,
  })
}

function getNextDateKey(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + 1)
  return date.toISOString().slice(0, 10)
}

export function usePlanetaryHourEditor() {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(defaultSelectedDay)
  const [contentByDay, setContentByDay] = useState<
    Partial<Record<DayOfWeek, PlanetaryHourContent[]>>
  >({})
  const [dirtyDays, setDirtyDays] = useState<Set<DayOfWeek>>(() => new Set())
  const [loadedDays, setLoadedDays] = useState<Set<DayOfWeek>>(() => new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)

  const sequence = useMemo(() => buildSequenceForDay(selectedDay), [selectedDay])
  const hasUnsavedChanges = dirtyDays.has(selectedDay)
  const selectedContent = contentByDay[selectedDay]

  const rows = useMemo<PlanetaryHourEditorRow[]>(
    () =>
      sequence.map((sequenceRow) => {
        const content = selectedContent?.find(
          (item) => item.hourNumber === sequenceRow.hour,
        ) ?? {
          dayOfWeek: selectedDay,
          hourNumber: sequenceRow.hour,
          description: '',
          suggestion: '',
        }

        return {
          ...sequenceRow,
          content,
        }
      }),
    [selectedContent, selectedDay, sequence],
  )

  useEffect(() => {
    if (loadedDays.has(selectedDay)) {
      return undefined
    }

    const abortController = new AbortController()
    setIsLoading(true)
    setErrorMessage(null)

    getPlanetaryHoursWithSignal(selectedDay, abortController.signal)
      .then((content) => {
        if (abortController.signal.aborted) {
          return
        }

        setContentByDay((currentContent) => ({
          ...currentContent,
          [selectedDay]: currentContent[selectedDay] ?? content,
        }))
        setLoadedDays((currentLoadedDays) => new Set(currentLoadedDays).add(selectedDay))
      })
      .catch((error: unknown) => {
        if (abortController.signal.aborted) {
          return
        }

        setErrorMessage(getFriendlyErrorMessage(error, 'Unable to load planetary hour content.'))
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setIsLoading(false)
        }
      })

    return () => abortController.abort()
  }, [loadedDays, selectedDay])

  useEffect(() => {
    if (!showSaveSuccess) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => setShowSaveSuccess(false), 2600)
    return () => window.clearTimeout(timeoutId)
  }, [showSaveSuccess])

  function updateHourContent(
    hourNumber: number,
    field: EditablePlanetaryHourField,
    value: string,
  ) {
    setContentByDay((currentContent) => {
      const currentDayContent = currentContent[selectedDay] ?? createEmptyDayContent(selectedDay)

      return {
        ...currentContent,
        [selectedDay]: currentDayContent.map((item) =>
          item.hourNumber === hourNumber
            ? {
                ...item,
                [field]: value,
              }
            : item,
        ),
      }
    })
    setDirtyDays((currentDirtyDays) => new Set(currentDirtyDays).add(selectedDay))
    setShowSaveSuccess(false)
    setErrorMessage(null)
  }

  async function saveChanges() {
    if (isSaving || !hasUnsavedChanges) {
      return
    }

    setIsSaving(true)
    setErrorMessage(null)

    try {
      const savedContent = await updatePlanetaryHours(
        selectedDay,
        rows.map((row) => ({
          hourNumber: row.hour,
          description: row.content.description,
          suggestion: row.content.suggestion,
        })),
      )

      setContentByDay((currentContent) => ({
        ...currentContent,
        [selectedDay]: savedContent,
      }))
      setDirtyDays((currentDirtyDays) => {
        const nextDirtyDays = new Set(currentDirtyDays)
        nextDirtyDays.delete(selectedDay)
        return nextDirtyDays
      })
      setLoadedDays((currentLoadedDays) => new Set(currentLoadedDays).add(selectedDay))
      setShowSaveSuccess(true)
    } catch (error) {
      setErrorMessage(getFriendlyErrorMessage(error, 'Unable to save changes. Please try again.'))
      setShowSaveSuccess(false)
    } finally {
      setIsSaving(false)
    }
  }

  return {
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
  }
}

function createEmptyDayContent(dayOfWeek: DayOfWeek): PlanetaryHourContent[] {
  return Array.from({ length: 24 }, (_, index) => ({
    dayOfWeek,
    hourNumber: index + 1,
    description: '',
    suggestion: '',
  }))
}

function getFriendlyErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message === 'Admin API URL is not configured.') {
    return 'Admin API URL is not configured.'
  }

  return fallback
}
