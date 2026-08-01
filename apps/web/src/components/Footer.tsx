import { getAndroidApkUrl } from '../config/androidRelease';

const quickLinks = [
  { label: 'Schedule Table', href: '/schedule' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Use', href: '/terms' },
  { label: 'About Us', href: '/about' },
  { label: 'Disclaimer', href: '/disclaimer' },
  { label: 'Contact Us', href: '/contact' },
];

export function Footer() {
  const apkUrl = getAndroidApkUrl();

  return (
    <footer className="site-footer">
      <div className="footer-branding">
        <p>Designed &amp; Developed by Aliasgar Raj &bull; Signal Growth</p>
        <p>&copy; 2026 Signal Growth</p>
      </div>
      <nav className="footer-links" aria-label="Quick links">
        <h2>Quick Links</h2>
        <ul>
          <li>
            <a href="/">Home</a>
          </li>
          {apkUrl ? (
            <li>
              <a href={apkUrl} rel="noopener noreferrer">
                Downloads
              </a>
            </li>
          ) : null}
          {quickLinks.map((link) => (
            <li key={link.href}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
        </ul>
      </nav>
    </footer>
  );
}
