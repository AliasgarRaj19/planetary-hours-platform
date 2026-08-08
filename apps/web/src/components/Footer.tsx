import { useEffect, useState } from 'react';
import {
  trackAppDownloadClick,
  trackBlogCategorySelect,
} from '../analytics/events';
import { getPublishedCategories, type BlogCategory } from '../api/blog';
import { useAndroidDownloadAction } from '../hooks/useAndroidDownloadAction';

const companyLinks = [
  { label: 'About Us', href: '/about' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Use', href: '/terms' },
  { label: 'Disclaimer', href: '/disclaimer' },
  { label: 'Contact Us', href: '/contact' },
];

export function Footer() {
  const downloadAction = useAndroidDownloadAction();
  const [categories, setCategories] = useState<BlogCategory[]>([]);

  useEffect(() => {
    let ignore = false;

    getPublishedCategories()
      .then((nextCategories) => {
        if (!ignore) {
          setCategories(nextCategories.slice(0, 6));
        }
      })
      .catch(() => {
        if (!ignore) {
          setCategories([]);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <footer className="site-footer">
      <div className="footer-columns">
        <nav className="footer-link-column" aria-labelledby="footer-quick-links">
          <h2 id="footer-quick-links">Quick Links</h2>
          <ul>
            <li>
              <a href="/">Home</a>
            </li>
            {downloadAction.url ? (
              <li>
                <a
                  href={downloadAction.url}
                  onClick={() =>
                    trackAppDownloadClick({
                      distributionMode: downloadAction.distributionMode,
                      linkLocation: 'footer',
                    })
                  }
                  rel="noopener noreferrer">
                  Downloads
                </a>
              </li>
            ) : null}
            <li>
              <a href="/schedule">Schedule Table</a>
            </li>
          </ul>
        </nav>

        <nav className="footer-link-column" aria-labelledby="footer-company-links">
          <h2 id="footer-company-links">Company</h2>
          <ul>
            {companyLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="footer-link-column" aria-labelledby="footer-blog-links">
          <h2 id="footer-blog-links">Planetary Hour Blog</h2>
          {categories.length > 0 ? (
            <ul>
              {categories.map((category) => (
                <li key={category.id}>
                  <a
                    href={`/blog?category=${encodeURIComponent(category.slug)}`}
                    onClick={() =>
                      trackBlogCategorySelect({
                        categoryName: category.name,
                        categorySlug: category.slug,
                      })
                    }>
                    {category.name}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="footer-empty">No published categories yet.</p>
          )}
        </nav>
      </div>

      <div className="footer-bottom">
        <p>
          Designed &amp; Developed by Aliasgar Raj &bull;{' '}
          <span className="footer-company-name">Signal Growth</span>
        </p>
        <p>&copy; 2026 Signal Growth. All Rights Reserved.</p>
      </div>
    </footer>
  );
}
