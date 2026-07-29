export function PlaceholderPage({ description, title }: { description: string; title: string }) {
  return (
    <section className="page-section">
      <div className="page-heading">
        <p className="section-kicker">Admin area</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className="empty-panel">
        <p>No admin tools are connected yet.</p>
      </div>
    </section>
  )
}
