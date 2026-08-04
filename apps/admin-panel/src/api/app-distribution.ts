import { clearStoredToken, readStoredToken } from '../auth/session'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')

export type AppDistributionMode = 'direct_apk' | 'google_play'

export type AppDistributionArtifact = {
  fileName: string
  originalFileName: string
  mimeType: string
  sizeBytes: number
  publicUrl: string
  checksumSha256: string
  versionName: string | null
  versionCode: number | null
  createdAt: string
}

export type AppDistribution = {
  platform: 'android'
  activeMode: AppDistributionMode
  isEnabled: boolean
  label: string
  actionUrl: string | null
  storeUrl: string | null
  artifact: AppDistributionArtifact | null
}

export type UpdateAppDistributionInput = {
  activeMode?: AppDistributionMode
  isEnabled?: boolean
  storeUrl?: string | null
}

export async function getAndroidDistribution() {
  return requestAppDistribution<AppDistribution>('/api/v1/admin/app-distribution/android')
}

export async function updateAndroidDistribution(input: UpdateAppDistributionInput) {
  return requestAppDistribution<AppDistribution>('/api/v1/admin/app-distribution/android', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })
}

export async function uploadAndroidApk(input: {
  file: File
  versionName?: string
  versionCode?: string
}) {
  const body = new FormData()
  body.append('apk', input.file)

  if (input.versionName?.trim()) {
    body.append('versionName', input.versionName.trim())
  }

  if (input.versionCode?.trim()) {
    body.append('versionCode', input.versionCode.trim())
  }

  return requestAppDistribution<{
    distribution: AppDistribution
    artifact: AppDistributionArtifact
  }>('/api/v1/admin/app-distribution/android/apk', {
    method: 'POST',
    body,
  })
}

async function requestAppDistribution<T>(path: string, options?: RequestInit): Promise<T> {
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
    const message = await readErrorMessage(response)
    throw new Error(message ?? `Request failed with status ${response.status}.`)
  }

  return response.json() as Promise<T>
}

async function readErrorMessage(response: Response) {
  try {
    const body = (await response.json()) as { message?: string | string[] }

    if (Array.isArray(body.message)) {
      return body.message.join(' ')
    }

    return body.message
  } catch {
    return null
  }
}
