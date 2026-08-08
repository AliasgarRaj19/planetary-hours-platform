import { useEffect, useMemo, useRef, useState } from 'react';
import { Footer } from '../components/Footer';
import { SiteHomeLink } from '../components/SiteHomeLink';
import { SolarSystemBackground } from '../components/SolarSystemBackground';
import { getPublishedArticle, type BlogArticle } from '../api/blog';
import { trackBlogArticleView } from '../analytics/events';
import { useDynamicSeo } from '../seo/useDynamicSeo';
import { renderMarkdownToSafeHtml } from '../utils/markdown';

export function BlogArticlePage({ slug }: { slug: string }) {
  const [article, setArticle] = useState<BlogArticle | null>(null);
  const [status, setStatus] = useState('Loading article...');
  const [notFound, setNotFound] = useState(false);
  const trackedArticleKey = useRef('');

  useEffect(() => {
    let ignore = false;

    setArticle(null);
    setStatus('Loading article...');
    setNotFound(false);

    getPublishedArticle(slug)
      .then((nextArticle) => {
        if (ignore) {
          return;
        }

        setArticle(nextArticle);
        setStatus('');
        setNotFound(false);
      })
      .catch(() => {
        if (ignore) {
          return;
        }

        setStatus('');
        setNotFound(true);
      });

    return () => {
      ignore = true;
    };
  }, [slug]);

  useDynamicSeo(
    article
      ? {
          title: article.seoTitle || article.title,
          description: article.seoDescription || article.excerpt,
          path: `/blog/${article.slug}`,
          type: 'article',
          publishedAt: article.publishedAt,
          updatedAt: article.updatedAt,
        }
      : null,
  );

  const renderedBody = useMemo(
    () => (article ? renderMarkdownToSafeHtml(article.bodyMarkdown) : ''),
    [article],
  );

  useEffect(() => {
    if (!article) {
      return;
    }

    const articleKey = `${article.id}:${article.slug}`;

    if (trackedArticleKey.current === articleKey) {
      return;
    }

    trackedArticleKey.current = articleKey;
    trackBlogArticleView({
      articleSlug: article.slug,
      articleTitle: article.title,
    });
  }, [article?.id, article?.slug, article?.title]);

  return (
    <main className="app-shell">
      <SolarSystemBackground />
      <div className="page-layer static-page-layer">
        <SiteHomeLink />
        <article className="static-page policy-page blog-article-page">
          {status ? <p className="blog-status">{status}</p> : null}
          {notFound ? (
            <header className="policy-header">
              <p className="eyebrow">Article not found</p>
              <h1>Article not found</h1>
              <p>This article is not published or is no longer available.</p>
            </header>
          ) : null}
          {article ? (
            <>
              <header className="policy-header">
                <p className="eyebrow">{formatDate(article.publishedAt)}</p>
                <h1>{article.title}</h1>
                <p>{article.excerpt}</p>
                <div className="blog-category-list">
                  {article.categories.map((category) => (
                    <span key={category.id}>{category.name}</span>
                  ))}
                </div>
              </header>
              <div
                className="article-body"
                dangerouslySetInnerHTML={{ __html: renderedBody }}
              />
            </>
          ) : null}
        </article>
        <Footer />
      </div>
    </main>
  );
}

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat('en', { dateStyle: 'long' }).format(new Date(value)) : 'Published article';
}
