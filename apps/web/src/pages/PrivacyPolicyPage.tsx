import { Footer } from '../components/Footer';
import { AnalyticsPreferences } from '../components/AnalyticsPreferences';
import { SiteHomeLink } from '../components/SiteHomeLink';
import { SolarSystemBackground } from '../components/SolarSystemBackground';

export function PrivacyPolicyPage() {
  return (
    <main className="app-shell">
      <SolarSystemBackground />
      <div className="page-layer static-page-layer">
        <SiteHomeLink />
        <article className="static-page policy-page">
          <header className="policy-header">
            <p className="eyebrow">Planetary Hours</p>
            <h1>Privacy Policy</h1>
            <p>
              <strong>Effective Date:</strong> July 23, 2026
            </p>
          </header>

          <section>
            <h2>1. Introduction</h2>
            <p>
              Welcome to <strong>Planetary Hours</strong>.
            </p>
            <p>
              Planetary Hours is designed, developed, and maintained by{' '}
              <strong>Signal Growth</strong>. This Privacy Policy explains how information is
              collected, used, stored, and protected when you use the Planetary Hours mobile
              application, website, and related services.
            </p>
            <p>
              By using Planetary Hours, you acknowledge the practices described in this Privacy
              Policy.
            </p>
          </section>

          <section>
            <h2>2. Information We Collect</h2>
            <h3>Device Location</h3>
            <p>
              Planetary Hours may request access to your device&apos;s location to calculate
              planetary hours accurately according to your geographical position and local time.
            </p>
            <p>
              Location information is used to provide the application&apos;s core calculation
              features. It is not sold or used for advertising.
            </p>

            <h3>Contact Information</h3>
            <p>
              When you contact us through a contact form, email, or another support channel, we may
              collect information such as:
            </p>
            <ul>
              <li>Your name</li>
              <li>Your email address</li>
              <li>The subject of your inquiry</li>
              <li>The content of your message</li>
              <li>Any information you voluntarily provide</li>
            </ul>
            <p>
              Contact submissions may be retained for reference, customer support, service
              improvement, and the development of more user-friendly applications.
            </p>

            <h3>Technical Information</h3>
            <p>
              When you access the Planetary Hours website or application, limited technical
              information may be processed as part of normal internet and application operation. This
              may include:
            </p>
            <ul>
              <li>Device type</li>
              <li>Operating system</li>
              <li>Application version</li>
              <li>Browser type</li>
              <li>Internet Protocol address</li>
              <li>Request timestamps</li>
              <li>Basic server or diagnostic information</li>
            </ul>
            <p>We do not currently use this information for advertising or user profiling.</p>

            <h3>Optional Website Analytics</h3>
            <p>
              The public website may use Google Analytics 4 after you choose to allow optional
              analytics. Analytics helps us understand aggregated usage patterns such as page views,
              device or browser information, and basic interaction events so we can improve the
              website.
            </p>
            <p>
              Analytics is consent-based. You may reject analytics, and the website should continue
              to work normally. Precise latitude and longitude used for planetary-hour calculations
              are not sent to Google Analytics. Contact-form contents, authentication tokens, email
              addresses, and private admin data are also not sent to Google Analytics.
            </p>
            <AnalyticsPreferences />
          </section>

          <section>
            <h2>3. How We Use Information</h2>
            <p>We may use information to:</p>
            <ul>
              <li>Calculate planetary hours accurately</li>
              <li>Provide and maintain the application&apos;s core functionality</li>
              <li>Respond to inquiries and support requests</li>
              <li>Understand reported problems</li>
              <li>Improve the usability, reliability, and security of our services</li>
              <li>Develop future applications and features based on user needs</li>
              <li>Prevent misuse or unauthorized activity</li>
              <li>Comply with applicable legal requirements</li>
            </ul>
            <p>We do not sell personal information.</p>
          </section>

          <section>
            <h2>4. Device Permissions</h2>
            <h3>Location Permission</h3>
            <p>
              The application may request foreground location permission to determine the user&apos;s
              approximate or precise geographical position for planetary hour calculations.
            </p>
            <p>
              Location access should only occur when required for the relevant application feature.
            </p>
            <p>
              Users may deny or revoke location permission through their device settings. Some
              calculations or location-based features may not work correctly without this permission.
            </p>

            <h3>Internet Access</h3>
            <p>Internet access may be used to:</p>
            <ul>
              <li>Access website resources</li>
              <li>Communicate with Planetary Hours services</li>
              <li>Retrieve application information</li>
              <li>Check for or download application updates</li>
              <li>Submit contact or support requests</li>
            </ul>
          </section>

          <section>
            <h2>5. Contact Form Information</h2>
            <p>Information submitted through the Planetary Hours contact form may be stored for:</p>
            <ul>
              <li>Responding to the user&apos;s inquiry</li>
              <li>Maintaining a record of support communication</li>
              <li>Identifying recurring issues</li>
              <li>Improving existing products</li>
              <li>Helping design future applications that are more useful and user-friendly</li>
            </ul>
            <p>Contact information will not be sold or used for unrelated advertising.</p>
            <p>
              Users should avoid submitting passwords, payment information, government identification
              numbers, medical information, or other highly sensitive information through the contact
              form.
            </p>
          </section>

          <section>
            <h2>6. Data Sharing</h2>
            <p>We do not sell, rent, or trade personal information.</p>
            <p>Information may be disclosed only when reasonably necessary:</p>
            <ul>
              <li>To operate or maintain Planetary Hours</li>
              <li>To trusted service providers acting on our behalf</li>
              <li>To investigate fraud, abuse, security issues, or technical problems</li>
              <li>
                To protect the rights, property, or safety of Signal Growth, Planetary Hours, users,
                or the public
              </li>
              <li>To comply with applicable laws, court orders, or lawful government requests</li>
              <li>
                As part of a business restructuring, transfer, merger, or acquisition, subject to
                applicable legal requirements
              </li>
            </ul>
            <p>
              Service providers should only process information for the purpose for which it was
              provided.
            </p>
          </section>

          <section>
            <h2>7. Data Storage and Retention</h2>
            <p>
              We retain personal information only for as long as reasonably necessary for the
              purposes described in this Privacy Policy, including support, recordkeeping, service
              improvement, security, and legal compliance.
            </p>
            <p>Contact messages may be retained for future reference and product improvement.</p>
            <p>Retention periods may vary depending on:</p>
            <ul>
              <li>The nature of the information</li>
              <li>The reason it was collected</li>
              <li>Operational requirements</li>
              <li>Security requirements</li>
              <li>Applicable legal obligations</li>
            </ul>
            <p>
              Information that is no longer required may be deleted, anonymized, or securely archived
              where appropriate.
            </p>
          </section>

          <section>
            <h2>8. Data Security</h2>
            <p>
              We use reasonable administrative, technical, and organizational measures to protect
              information against unauthorized access, misuse, loss, alteration, or disclosure.
            </p>
            <p>
              However, no internet transmission, application, server, or electronic storage system can
              be guaranteed to be completely secure. Users provide information at their own discretion
              and risk.
            </p>
          </section>

          <section>
            <h2>9. Third-Party Services and Links</h2>
            <p>
              Planetary Hours may use hosting, infrastructure, email, update delivery, or other
              technical service providers to operate the website and application.
            </p>
            <p>
              The website or application may also contain links to external websites or services.
              Signal Growth is not responsible for the privacy practices, security, or content of
              third-party websites.
            </p>
            <p>
              Users should review the privacy policies of third-party services before providing
              personal information to them.
            </p>
          </section>

          <section>
            <h2>10. Children&apos;s Privacy</h2>
            <p>Planetary Hours is not specifically directed at children.</p>
            <p>
              We do not knowingly collect personal information from children in violation of
              applicable law. If a parent or guardian believes that a child has provided personal
              information without appropriate authorization, they may contact us and request its
              deletion.
            </p>
          </section>

          <section>
            <h2>11. User Choices and Rights</h2>
            <p>Depending on applicable law and location, users may have the right to:</p>
            <ul>
              <li>Request access to personal information</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of personal information</li>
              <li>Object to or restrict certain processing</li>
              <li>Withdraw consent where processing is based on consent</li>
              <li>Request information about how their data is handled</li>
            </ul>
            <p>
              Users may also manage application permissions, including location access, through their
              device settings.
            </p>
            <p>
              Requests may be submitted using the contact details below. We may need to verify the
              requester&apos;s identity before completing certain requests.
            </p>
          </section>

          <section>
            <h2>12. Changes to This Privacy Policy</h2>
            <p>We may update this Privacy Policy when:</p>
            <ul>
              <li>Application features change</li>
              <li>Data practices change</li>
              <li>New services are introduced</li>
              <li>Legal or regulatory requirements change</li>
              <li>Security or operational practices change</li>
            </ul>
            <p>
              The revised policy will be published on the Planetary Hours website with an updated
              effective date.
            </p>
            <p>Users are encouraged to review this page periodically.</p>
          </section>

          <section>
            <h2>13. Contact Us</h2>
            <p>
              For questions, concerns, privacy requests, or feedback relating to this Privacy Policy,
              contact:
            </p>
            <p>
              <strong>Planetary Hours</strong>
              <br />
              Developed and maintained by <strong>Signal Growth</strong>
            </p>
            <p>
              <strong>Business Email:</strong>{' '}
              <a href="mailto:aliasgerraj7@gmail.com">aliasgerraj7@gmail.com</a>
            </p>
            <p>We will make reasonable efforts to respond as promptly as possible.</p>
          </section>

          <section>
            <h2>14. Ownership</h2>
            <p>
              Planetary Hours is designed, developed, and maintained by{' '}
              <strong>Signal Growth</strong>.
            </p>
            <p>
              Our goal is to combine the traditional system of planetary hours with modern technology
              to provide an accurate, reliable, and user-friendly experience.
            </p>
            <p>
              Signal Growth is committed to transparency, responsible information handling, user
              privacy, and the continuous improvement of its products and services.
            </p>
          </section>
        </article>
        <Footer />
      </div>
    </main>
  );
}
