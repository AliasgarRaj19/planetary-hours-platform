import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { PlanetaryHoursTable } from './components/PlanetaryHoursTable';
import { SolarSystemBackground } from './components/SolarSystemBackground';
import { planetaryHours } from './data/planetaryHours';

function App() {
  return (
    <main className="app-shell">
      <SolarSystemBackground />
      <div className="page-layer">
        <Header />
        <section className="content">
          <SummaryCards />
          <PlanetaryHoursTable hours={planetaryHours} />
        </section>
      </div>
    </main>
  );
}

export default App;
