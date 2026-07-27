import { Footer } from '../components/Footer';
import { SolarSystemBackground } from '../components/SolarSystemBackground';

export function ContactPage() {
  return (
    <main className="app-shell">
      <SolarSystemBackground />
      <div className="page-layer static-page-layer">
        <article className="static-page policy-page contact-page">
          <header className="policy-header">
            <p className="eyebrow">Planetary Hours</p>
            <h1>Contact Us</h1>
            <p>
              For support, questions, or feedback about Planetary Hours, please contact us by email.
            </p>
          </header>

          <section className="contact-panel" aria-labelledby="contact-email-heading">
            <h2 id="contact-email-heading">Support Email</h2>
            <p>
              Email:{' '}
              <a href="mailto:aliasgerraj7@gmail.com">aliasgerraj7@gmail.com</a>
            </p>
          </section>

          <section>
            <h2>What You Can Contact Us About</h2>
            <p>You may contact Planetary Hours regarding:</p>
            <ul>
              <li>general questions;</li>
              <li>technical problems;</li>
              <li>incorrect location or timing information;</li>
              <li>privacy questions;</li>
              <li>feedback and suggestions;</li>
              <li>application-store or download issues.</li>
            </ul>
          </section>

          <section>
            <h2>Before Sending Sensitive Information</h2>
            <p>
              Please avoid sending passwords, payment information, government identification numbers,
              medical information, or other highly sensitive information by email.
            </p>
            <p>
              Information you voluntarily provide may be retained as described in the Privacy Policy
              so we can respond to enquiries, understand reported issues, and improve Planetary
              Hours.
            </p>
          </section>
        </article>
        <Footer />
      </div>
    </main>
  );
}
