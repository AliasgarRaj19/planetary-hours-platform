import { storeToken } from '../auth/session'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')

type LoginResponse = {
  accessToken: string
  tokenType: 'Bearer'
}

export async function loginAdmin(username: string, password: string) {
  if (!API_BASE_URL) {
    throw new Error('Admin API URL is not configured.')
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password, username }),
  })

  if (response.status === 401) {
    throw new Error('Invalid username or password.')
  }

  if (!response.ok) {
    throw new Error('Unable to sign in right now.')
  }

  const data = (await response.json()) as LoginResponse
  storeToken(data.accessToken)

  return data
}
