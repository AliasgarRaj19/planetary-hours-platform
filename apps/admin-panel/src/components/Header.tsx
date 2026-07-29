import { useAuth } from '../auth/useAuth'

export function Header() {
  const auth = useAuth()

  return (
    <header className="admin-header">
      <div>
        <p className="header-eyebrow">Planetary Hours</p>
        <h1>Admin Panel</h1>
      </div>
      <div className="header-actions" aria-label="Admin status">
        <span className="status-dot" aria-hidden="true" />
        <span>Signed in</span>
        <button onClick={auth.logout} type="button">
          Logout
        </button>
      </div>
    </header>
  )
}
