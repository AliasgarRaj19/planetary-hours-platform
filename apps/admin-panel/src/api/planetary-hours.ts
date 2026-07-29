import type { DayOfWeek, PlanetaryHourContent } from '../features/planetary-hours/types'
import { clearStoredToken, readStoredToken } from '../auth/session'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')

type PlanetaryHourContentPayload = Pick<
  PlanetaryHourContent,
  'hourNumber' | 'description' | 'suggestion'
>

export async function getPlanetaryHours(dayOfWeek: DayOfWeek) {
  return requestPlanetaryHours<PlanetaryHourContent[]>(`/api/v1/planetary-hours/${dayOfWeek}`)
}

export async function getPlanetaryHoursWithSignal(dayOfWeek: DayOfWeek, signal: AbortSignal) {
  return requestPlanetaryHours<PlanetaryHourContent[]>(`/api/v1/planetary-hours/${dayOfWeek}`, {
    signal,
  })
}

export async function updatePlanetaryHours(
  dayOfWeek: DayOfWeek,
  rows: PlanetaryHourContentPayload[],
) {
  return requestPlanetaryHours<PlanetaryHourContent[]>(`/api/v1/planetary-hours/${dayOfWeek}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(rows),
  })
}

async function requestPlanetaryHours<T>(path: string, options?: RequestInit): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error('Admin API URL is not configured.')
  }

  const headers = new Headers(options?.headers)
  const token = readStoredToken()

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    clearStoredToken()
    throw new Error('Your session has expired. Please sign in again.')
  }

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}.`)
  }

  return response.json() as Promise<T>
}
