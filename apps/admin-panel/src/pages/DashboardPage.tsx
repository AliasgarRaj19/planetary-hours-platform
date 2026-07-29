const statusCards = [
  {
    label: 'Website',
    status: 'Online',
    detail: 'Public site shell is ready for monitoring.',
  },
  {
    label: 'Mobile App',
    status: 'Beta',
    detail: 'Android release controls will appear here later.',
  },
  {
    label: 'Backend',
    status: 'Pending',
    detail: 'Backend integration has not been connected yet.',
  },
]

export function DashboardPage() {
  return (
    <section className="page-section">
      <div className="page-heading">
        <p className="section-kicker">Dashboard</p>
        <h2>Welcome back</h2>
        <p>
          Manage the Planetary Hours platform from one calm workspace. This first shell keeps the
          structure ready while authentication, APIs, and live data are still offline.
        </p>
      </div>

      <div className="status-grid">
        {statusCards.map((card) => (
          <article className="status-card" key={card.label}>
            <div>
              <p className="card-label">{card.label}</p>
              <h3>{card.status}</h3>
            </div>
            <p>{card.detail}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
