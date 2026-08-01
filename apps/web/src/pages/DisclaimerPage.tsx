import { Footer } from '../components/Footer';
import { SiteHomeLink } from '../components/SiteHomeLink';
import { SolarSystemBackground } from '../components/SolarSystemBackground';

export function DisclaimerPage() {
  return (
    <main className="app-shell">
      <SolarSystemBackground />
      <div className="page-layer static-page-layer">
        <SiteHomeLink />
        <article className="static-page policy-page">
          <header className="policy-header">
            <p className="eyebrow">Planetary Hours</p>
            <h1>Disclaimer</h1>
            <p>
              <strong>Last updated:</strong> July 27, 2026
            </p>
          </header>

          <section>
            <h2>General Information</h2>
            <p>
              Planetary Hours provides information based on traditional planetary-hour calculation
              methods. The content available through the website and mobile application is intended
              for general informational, educational, cultural, and personal-reference purposes only.
            </p>
            <p>
              Planetary Hours does not claim that planetary-hour calculations are scientifically
              proven, universally accepted, or capable of producing guaranteed results.
            </p>
          </section>

          <section>
            <h2>Traditional Calculations</h2>
            <p>
              Planetary-hour timings are calculated using traditional methods based primarily on
              local sunrise and sunset times.
            </p>
            <p>
              Different traditions, calculation systems, astronomical data providers, geographic
              assumptions, and rounding methods may produce slightly different results. Therefore, the
              timings shown by Planetary Hours may differ from those provided by other websites,
              applications, practitioners, or traditional systems.
            </p>
            <p>
              We aim to provide calculations that are consistent, transparent, and easy to
              understand, but we do not claim that any single calculation method is the only correct
              method.
            </p>
          </section>

          <section>
            <h2>No Guarantee of Results</h2>
            <p>
              Planetary Hours does not guarantee that using a particular planetary hour will produce
              any specific result, benefit, event, outcome, or change in circumstances.
            </p>
            <p>
              Any interpretation or use of planetary-hour information is entirely at the discretion
              of the user.
            </p>
          </section>

          <section>
            <h2>Not Professional Advice</h2>
            <p>
              The information provided by Planetary Hours is not intended to replace professional
              advice.
            </p>
            <p>
              It should not be treated as medical, legal, financial, investment, psychological,
              religious, spiritual, business, or other professional advice.
            </p>
            <p>
              Users should consult a qualified professional before making decisions that may affect
              their health, finances, legal rights, safety, business, relationships, or personal
              well-being.
            </p>
          </section>

          <section>
            <h2>Sunrise and Sunset Data</h2>
            <p>
              Planetary-hour calculations depend on sunrise and sunset information for the selected
              or detected location.
            </p>
            <p>
              Sunrise and sunset data may be obtained from external astronomical data sources or
              calculated using recognised astronomical formulas. Actual local conditions, terrain,
              elevation, atmospheric conditions, device settings, location accuracy, time-zone
              configuration, and daylight-saving rules may affect the displayed times.
            </p>
            <p>
              Planetary Hours does not guarantee that all sunrise, sunset, or planetary-hour timings
              will be completely error-free or suitable for time-critical activities.
            </p>
          </section>

          <section>
            <h2>Location Information</h2>
            <p>
              When location access is permitted, Planetary Hours may use the device&apos;s foreground
              location to calculate relevant sunrise, sunset, and planetary-hour timings.
            </p>
            <p>
              Location accuracy depends on the user&apos;s device, operating system, network, GPS
              availability, permissions, and environmental conditions.
            </p>
            <p>
              Users remain responsible for confirming that the selected location and time zone are
              correct.
            </p>
          </section>

          <section>
            <h2>Availability and Technical Limitations</h2>
            <p>
              We aim to keep Planetary Hours available and functioning properly. However, we do not
              guarantee uninterrupted, continuous, secure, or error-free access to the website or
              application.
            </p>
            <p>
              The service may occasionally be unavailable because of maintenance, updates, technical
              problems, hosting interruptions, network failures, software errors, third-party service
              interruptions, or circumstances beyond our control.
            </p>
            <p>
              Features, designs, calculation methods, and service availability may be updated,
              modified, suspended, or discontinued when reasonably necessary.
            </p>
          </section>

          <section>
            <h2>External Links</h2>
            <p>
              Planetary Hours may contain links to external websites, services, application stores,
              platforms, or other third-party resources.
            </p>
            <p>
              These external services are not controlled by Planetary Hours or Signal Growth. We are
              not responsible for their content, availability, security, accuracy, privacy practices,
              policies, or services.
            </p>
            <p>
              The presence of an external link does not necessarily represent an endorsement,
              partnership, or guarantee.
            </p>
          </section>

          <section>
            <h2>Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, Planetary Hours and Signal Growth
              will not be responsible for any direct, indirect, incidental, special, consequential, or
              other loss arising from:
            </p>
            <ul>
              <li>reliance on planetary-hour information;</li>
              <li>inaccurate location, sunrise, sunset, time-zone, or timing data;</li>
              <li>decisions made using information provided by the service;</li>
              <li>interruption or unavailability of the website or application;</li>
              <li>loss of data;</li>
              <li>device, network, or software problems;</li>
              <li>third-party services or external links; or</li>
              <li>unauthorised access or other circumstances beyond our reasonable control.</li>
            </ul>
            <p>Users access and use Planetary Hours at their own discretion and responsibility.</p>
          </section>

          <section>
            <h2>User Responsibility</h2>
            <p>
              Users are responsible for reviewing the displayed location, date, time zone, sunrise
              time, sunset time, and planetary-hour information before relying on it.
            </p>
            <p>
              Users should apply their own judgement and should not use Planetary Hours as the sole
              basis for important, high-risk, professional, financial, medical, legal, safety-related,
              or time-critical decisions.
            </p>
          </section>

          <section>
            <h2>Changes to This Disclaimer</h2>
            <p>
              We may update this Disclaimer when the service, features, calculation methods, legal
              requirements, or operating practices change.
            </p>
            <p>
              The revised version will be published on this page with an updated &ldquo;Last
              updated&rdquo; date. Continued use of Planetary Hours after an update means that the
              user accepts the revised Disclaimer.
            </p>
          </section>

          <section>
            <h2>Contact</h2>
            <p>For questions about this Disclaimer, contact:</p>
            <p>
              <strong>Email:</strong>{' '}
              <a href="mailto:aliasgerraj7@gmail.com">aliasgerraj7@gmail.com</a>
            </p>
            <p>
              <strong>Operated by:</strong> Signal Growth
            </p>
          </section>
        </article>
        <Footer />
      </div>
    </main>
  );
}
