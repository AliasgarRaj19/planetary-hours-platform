const planets = [
  { name: 'Mercury', orbit: 'orbit-one', planet: 'planet-mercury' },
  { name: 'Venus', orbit: 'orbit-two', planet: 'planet-venus' },
  { name: 'Earth', orbit: 'orbit-three', planet: 'planet-earth' },
  { name: 'Mars', orbit: 'orbit-four', planet: 'planet-mars' },
  { name: 'Jupiter', orbit: 'orbit-five', planet: 'planet-jupiter' },
];

export function SolarSystemBackground() {
  return (
    <div className="solar-background" aria-hidden="true">
      <div className="star-field" />
      <div className="solar-system">
        <div className="sun" />
        {planets.map((item) => (
          <div className={`orbit ${item.orbit}`} key={item.name}>
            <span className={`planet ${item.planet}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
