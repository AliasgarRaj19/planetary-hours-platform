import { clearStoredToken, readStoredToken } from '../auth/session'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')

export type AnalyticsRange = 'today' | 'yesterday' | '7d' | '30d'

export type AnalyticsRealtime = {
  activeUsers: number
  recentViews: number
  recentEvents: number
  activePages: Array<{
    path: string
    title: string | null
    activeUsers: number
  }>
  events: Array<{
    eventName: string
    count: number
  }>
  refreshedAt: string
}

export type AnalyticsOverview = {
  range: AnalyticsRange
  users: number
  sessions: number
  views: number
  engagementRate: number | null
  averageEngagementTimeSeconds: number | null
  refreshedAt: string
}

export type AnalyticsPages = {
  range: AnalyticsRange
  items: Array<{
    path: string
    title: string | null
    views: number
    users: number
  }>
  refreshedAt: string
}

export type AnalyticsEvents = {
  range: AnalyticsRange
  customEvents: {
    appDownloadClicks: number
    scheduleDateChanges: number
    blogArticleViews: number
    blogCategorySelections: number
  }
  topEvents: Array<{
    eventName: string
    count: number
  }>
  refreshedAt: string
}

export type AnalyticsTraffic = {
  range: AnalyticsRange
  sources: Array<{
    sourceMedium: string
    users: number
    sessions: number
  }>
  countries: Array<{
    country: string
    users: number
  }>
  devices: Array<{
    deviceCategory: string
    users: number
  }>
  refreshedAt: string
}

export function getAnalyticsRealtime() {
  return requestAnalytics<AnalyticsRealtime>('/api/v1/admin/analytics/realtime')
}

export function getAnalyticsOverview(range: AnalyticsRange) {
  return requestAnalytics<AnalyticsOverview>(`/api/v1/admin/analytics/overview?range=${range}`)
}

export function getAnalyticsPages(range: AnalyticsRange) {
  return requestAnalytics<AnalyticsPages>(`/api/v1/admin/analytics/pages?range=${range}`)
}

export function getAnalyticsEvents(range: AnalyticsRange) {
  return requestAnalytics<AnalyticsEvents>(`/api/v1/admin/analytics/events?range=${range}`)
}

export function getAnalyticsTraffic(range: AnalyticsRange) {
  return requestAnalytics<AnalyticsTraffic>(`/api/v1/admin/analytics/traffic?range=${range}`)
}

async function requestAnalytics<T>(path: string): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error('Admin API URL is not configured.')
  }

  const headers = new Headers()
  const token = readStoredToken()

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers,
  })

  if (response.status === 401) {
    clearStoredToken()
    throw new Error('Your session has expired. Please sign in again.')
  }

  if (!response.ok) {
    const message = await readErrorMessage(response)
    throw new Error(message ?? `Request failed with status ${response.status}.`)
  }

  return response.json() as Promise<T>
}

async function readErrorMessage(response: Response) {
  try {
    const body = (await response.json()) as { message?: string | string[] }
    return Array.isArray(body.message) ? body.message.join(' ') : body.message
  } catch {
    return null
  }
}
