import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function Layout() {
  return (
    <div className="admin-shell">
      <Sidebar />
      <div className="workspace">
        <Header />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
