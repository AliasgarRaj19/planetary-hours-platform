import { NavLink } from 'react-router-dom'

const primaryNavigation = [{ label: 'Dashboard', path: '/' }]

const contentNavigation = [
  { label: 'Planetary Hours', path: '/planetary-hours' },
  { label: 'Analytics', path: '/analytics' },
  { label: 'Notifications', path: '/notifications' },
  { label: 'Settings', path: '/settings' },
]

export function Sidebar() {
  return (
    <aside className="sidebar" aria-label="Admin navigation">
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">
          PH
        </div>
        <div>
          <p>Planetary Hours</p>
          <span>Operations</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {primaryNavigation.map((item) => (
          <NavigationLink key={item.path} label={item.label} path={item.path} />
        ))}

        <p className="nav-section-label">Content</p>
        {contentNavigation.map((item) => (
          <NavigationLink key={item.path} label={item.label} path={item.path} />
        ))}
      </nav>
    </aside>
  )
}

function NavigationLink({ label, path }: { label: string; path: string }) {
  return (
    <NavLink
      className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
      end={path === '/'}
      to={path}
    >
      <span className="nav-icon" aria-hidden="true">
        {label.slice(0, 1)}
      </span>
      {label}
    </NavLink>
  )
}
