import {
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import { loginAdmin } from '../api/auth'
import { clearStoredToken, readStoredToken, subscribeToAuthChanges } from './session'
import { AuthContext, type AuthContextValue } from './auth-context'

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState(() => readStoredToken())

  useEffect(
    () => subscribeToAuthChanges(() => setToken(readStoredToken())),
    [],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(token),
      login: async (username, password) => {
        await loginAdmin(username, password)
      },
      logout: () => clearStoredToken(),
    }),
    [token],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
