import { Footer } from '../components/Footer';
import { SolarSystemBackground } from '../components/SolarSystemBackground';

export function AboutPage() {
  return (
    <main className="app-shell">
      <SolarSystemBackground />
      <div className="page-layer static-page-layer">
        <article className="static-page policy-page">
          <header className="policy-header">
            <p className="eyebrow">Planetary Hours</p>
            <h1>About Planetary Hours</h1>
          </header>

          <section>
            <h2>Our Story</h2>
            <p>
              Planetary Hours was created to make the traditional system of planetary hours more
              accessible through modern technology.
            </p>
            <p>
              For centuries, planetary hours have been used in various astrological and spiritual
              traditions to identify the planetary influence associated with different times of the
              day and night. While many references explain the underlying principles, performing the
              calculations manually can be time-consuming and, at times, confusing.
            </p>
            <p>
              Planetary Hours was developed to simplify this process while remaining respectful of
              the traditional methods on which these calculations are based.
            </p>
          </section>

          <section>
            <h2>Our Approach</h2>
            <p>
              Planetary Hours is built using traditional calculation methods described in authentic
              astrological and historical references.
            </p>
            <p>
              Different traditions, authors, and schools of practice may describe planetary hour
              calculations with slight variations. These differences can result in small variations
              of a few seconds or minutes depending on the interpretation or methodology followed.
            </p>
            <p>
              Rather than claiming absolute or universal accuracy, our goal is to implement a
              consistent, well-researched, and transparent approach that remains faithful to the
              traditional principles from which planetary hours originate.
            </p>
            <p>
              As our understanding grows and additional authentic references become available, we
              continue to review and refine the application wherever appropriate.
            </p>
          </section>

          <section>
            <h2>What Planetary Hours Provides</h2>
            <p>Planetary Hours is designed to help users by providing:</p>
            <ul>
              <li>Planetary hour calculations based on traditional methods.</li>
              <li>
                Calculations that adapt to the user&apos;s location and local sunrise and sunset
                times.
              </li>
              <li>A clean and easy-to-use interface.</li>
              <li>Consistent calculations using a documented methodology.</li>
              <li>Ongoing improvements based on research and user feedback.</li>
            </ul>
          </section>

          <section>
            <h2>Our Mission</h2>
            <p>
              Our mission is to preserve traditional knowledge while making it more accessible
              through modern technology.
            </p>
            <p>
              We aim to provide tools that are practical, reliable, and respectful of the traditions
              from which they are derived, enabling both beginners and experienced practitioners to
              use planetary hours with greater convenience.
            </p>
          </section>

          <section>
            <h2>Our Vision</h2>
            <p>Planetary Hours is intended to grow beyond a single calculation tool.</p>
            <p>
              Over time, we hope to develop a broader collection of applications and resources that
              support the study and practice of traditional astrology, spirituality, and related
              disciplines, while maintaining a commitment to quality, transparency, and continuous
              improvement.
            </p>
          </section>

          <section>
            <h2>About Signal Growth</h2>
            <p>
              Planetary Hours is designed, developed, and maintained by{' '}
              <strong>Signal Growth</strong>.
            </p>
            <p>
              Signal Growth focuses on building thoughtful digital products that combine traditional
              knowledge with modern software engineering. Our goal is to create applications that are
              practical, user-friendly, and built with long-term reliability in mind.
            </p>
          </section>

          <section>
            <h2>Our Commitment</h2>
            <p>We are committed to:</p>
            <ul>
              <li>Respecting the traditions that inspire this project.</li>
              <li>Being transparent about our calculation methods and their limitations.</li>
              <li>Continuously improving the application through research and user feedback.</li>
              <li>Protecting user privacy and handling information responsibly.</li>
              <li>
                Building software that users can trust through honesty rather than exaggerated
                claims.
              </li>
            </ul>
            <p>Thank you for being part of the Planetary Hours journey.</p>
          </section>
        </article>
        <Footer />
      </div>
    </main>
  );
}
