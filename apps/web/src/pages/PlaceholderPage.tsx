import { Footer } from '../components/Footer';
import { SolarSystemBackground } from '../components/SolarSystemBackground';

type PlaceholderPageProps = {
  title: string;
};

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <main className="app-shell">
      <SolarSystemBackground />
      <div className="page-layer static-page-layer">
        <section className="static-page">
          <p className="eyebrow">Planetary Hours</p>
          <h1>{title}</h1>
          <p>Content will be added later.</p>
        </section>
        <Footer />
      </div>
    </main>
  );
}
