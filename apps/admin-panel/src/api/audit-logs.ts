import { clearStoredToken, readStoredToken } from '../auth/session'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')

export type AuditLogResult = 'success' | 'failure'

export type AuditLogItem = {
  id: string
  createdAt: string
  actorType: string
  actorId: string | null
  actorUsername: string | null
  actorDisplayName: string | null
  actorRole: string | null
  action: string
  module: string
  resourceType: string
  resourceId: string | null
  resourceDisplayName: string | null
  description: string
  result: AuditLogResult
  metadata: unknown
  ipAddress: string | null
  userAgent: string | null
  requestId: string | null
}

export type AuditLogQuery = {
  page?: number
  pageSize?: number
  from?: string
  to?: string
  actor?: string
  module?: string
  action?: string
  result?: AuditLogResult | ''
  resourceType?: string
  resourceId?: string
  search?: string
}

export type AuditLogResponse = {
  items: AuditLogItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export type AuditLogFilterOptions = {
  actors: string[]
  modules: string[]
  actions: Array<{
    value: string
    module: string
  }>
  resourceTypes: string[]
}

export function getAuditLogs(query: AuditLogQuery = {}) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') {
      params.set(key, String(value))
    }
  }

  const suffix = params.toString() ? `?${params.toString()}` : ''
  return requestAuditLogs<AuditLogResponse>(`/api/v1/admin/audit-logs${suffix}`)
}

export function getAuditLogFilterOptions() {
  return requestAuditLogs<AuditLogFilterOptions>('/api/v1/admin/audit-logs/filter-options')
}

async function requestAuditLogs<T>(path: string): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error('Admin API URL is not configured.')
  }

  const headers = new Headers()
  const token = readStoredToken()

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { headers })

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
