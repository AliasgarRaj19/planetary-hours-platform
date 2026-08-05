import { useEffect, useState } from 'react';
import { Footer } from '../components/Footer';
import { SiteHomeLink } from '../components/SiteHomeLink';
import { SolarSystemBackground } from '../components/SolarSystemBackground';
import {
  getPublishedArticles,
  getPublishedArticlesByCategory,
  type BlogArticle,
} from '../api/blog';

export function BlogIndexPage() {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [status, setStatus] = useState('Loading articles...');
  const [error, setError] = useState('');
  const category = new URLSearchParams(window.location.search).get('category') ?? '';

  useEffect(() => {
    const request = category
      ? getPublishedArticlesByCategory(category)
      : getPublishedArticles();

    request
      .then((response) => {
        setArticles(response.items);
        setStatus('');
      })
      .catch(() => {
        setError('Blog articles are unavailable right now.');
        setStatus('');
      });
  }, [category]);

  return (
    <main className="app-shell">
      <SolarSystemBackground />
      <div className="page-layer static-page-layer">
        <SiteHomeLink />
        <article className="static-page policy-page blog-page">
          <header className="policy-header">
            <p className="eyebrow">Planetary Hours Blog</p>
            <h1>Planetary Hours Blog</h1>
            <p>
              Learn the foundations of planetary hours, the Chaldean order, planetary days, and
              traditional timing practices.
            </p>
          </header>

          {status ? <p className="blog-status">{status}</p> : null}
          {error ? <p className="blog-status">{error}</p> : null}

          <section className="blog-card-grid" aria-label="Published articles">
            {articles.length > 0 ? (
              articles.map((article) => (
                <a className="blog-card" href={`/blog/${article.slug}`} key={article.id}>
                  <p className="eyebrow">{formatDate(article.publishedAt)}</p>
                  <h2>{article.title}</h2>
                  <p>{article.excerpt}</p>
                  <div className="blog-category-list">
                    {article.categories.map((category) => (
                      <span key={category.id}>{category.name}</span>
                    ))}
                  </div>
                </a>
              ))
            ) : !status && !error ? (
              <p className="blog-status">No published articles are available yet.</p>
            ) : null}
          </section>
        </article>
        <Footer />
      </div>
    </main>
  );
}

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value)) : 'Published article';
}
