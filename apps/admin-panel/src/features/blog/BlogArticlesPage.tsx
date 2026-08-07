import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getAdminArticles, type BlogArticle } from '../../api/blog'
import {
  deriveArticleDisplayStatus,
  formatAdminDateTime,
  getNextScheduledStatusRefreshDelay,
} from './article-editor-utils'

export function BlogArticlesPage() {
  const [articles, setArticles] = useState<BlogArticle[]>([])
  const [status, setStatus] = useState('Loading articles...')
  const [error, setError] = useState('')
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    getAdminArticles()
      .then((nextArticles) => {
        setArticles(nextArticles)
        setStatus('')
      })
      .catch((nextError: unknown) => {
        setError(toErrorMessage(nextError))
        setStatus('')
      })
  }, [])

  useEffect(() => {
    const delay = getNextScheduledStatusRefreshDelay(articles, now)

    if (delay === null) {
      return
    }

    const timeout = window.setTimeout(() => {
      setNow(new Date())
    }, delay)

    return () => window.clearTimeout(timeout)
  }, [articles, now])

  return (
    <section className="page-section">
      <div className="page-heading action-heading">
        <div>
          <p className="section-kicker">Blog CMS</p>
          <h2>Articles</h2>
          <p>Create drafts, manage categories, and publish website articles.</p>
        </div>
        <div className="heading-actions">
          <Link className="admin-button secondary" to="/blog/categories">
            Categories
          </Link>
          <Link className="admin-button" to="/blog/new">
            New Article
          </Link>
        </div>
      </div>

      {status ? <p className="editor-message">{status}</p> : null}
      {error ? <p className="editor-message error">{error}</p> : null}

      <div className="editor-table-panel">
        <table className="hours-table admin-list-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Slug</th>
              <th>Status</th>
              <th>Categories</th>
              <th>Published</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {articles.length > 0 ? (
              articles.map((article) => (
                <tr key={article.id}>
                  <td>
                    <Link to={`/blog/${article.id}`}>{article.title}</Link>
                  </td>
                  <td>{article.slug}</td>
                  <td>
                    <ArticleStatus article={article} now={now} />
                  </td>
                  <td>{article.categories.map((category) => category.name).join(', ') || 'None'}</td>
                  <td>{formatDate(article.publishedAt)}</td>
                  <td>{formatDate(article.updatedAt)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6}>No blog articles yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function ArticleStatus({ article, now }: { article: BlogArticle; now: Date }) {
  const displayStatus = deriveArticleDisplayStatus(article, now)

  return (
    <div className="article-status-cell">
      <span className={`article-status-pill ${displayStatus.toLowerCase()}`}>{displayStatus}</span>
      {displayStatus === 'Scheduled' && article.publishedAt ? (
        <small>Scheduled for: {formatAdminDateTime(article.publishedAt)}</small>
      ) : null}
      {displayStatus === 'Published' && article.publishedAt ? (
        <small>Published: {formatAdminDateTime(article.publishedAt)}</small>
      ) : null}
    </div>
  )
}

function formatDate(value: string | null) {
  return value ? formatAdminDateTime(value) : '-'
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unable to load blog articles.'
}
