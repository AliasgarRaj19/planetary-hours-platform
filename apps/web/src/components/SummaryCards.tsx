const cards = [
  {
    title: 'Current Planetary Hour',
    value: 'Sun',
    detail: '6:00 AM - 7:00 AM',
  },
  {
    title: 'Time Remaining',
    value: '42 min',
    detail: 'Placeholder countdown',
  },
  {
    title: 'Next Planetary Hour',
    value: 'Venus',
    detail: '7:00 AM - 8:00 AM',
  },
];

export function SummaryCards() {
  return (
    <section className="summary-grid" aria-label="Planetary hour summary">
      {cards.map((card) => (
        <article className="summary-card" key={card.title}>
          <p>{card.title}</p>
          <strong>{card.value}</strong>
          <span>{card.detail}</span>
        </article>
      ))}
    </section>
  );
}
