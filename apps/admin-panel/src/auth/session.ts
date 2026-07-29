const TOKEN_STORAGE_KEY = 'planetary-hours.admin-token.v1'
const AUTH_CHANGED_EVENT = 'planetary-hours-admin-auth-changed'

export function readStoredToken() {
  return window.localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function storeToken(token: string) {
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token)
  notifyAuthChanged()
}

export function clearStoredToken() {
  window.localStorage.removeItem(TOKEN_STORAGE_KEY)
  notifyAuthChanged()
}

export function subscribeToAuthChanges(listener: () => void) {
  window.addEventListener(AUTH_CHANGED_EVENT, listener)
  return () => window.removeEventListener(AUTH_CHANGED_EVENT, listener)
}

function notifyAuthChanged() {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))
}
